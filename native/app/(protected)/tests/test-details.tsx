import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Activity,
	AlertTriangle,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Clock,
	Download,
	Edit,
	ExternalLink,
	File,
	FileCode,
	FileText,
	List,
	PlayCircle,
	Plus,
	PlusCircle,
	Shield,
	Trash2,
	Video,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { EditTestTitleModal } from "@/components/EditTestTitleModal";
import LiveAttempts from "@/components/LiveAttempts";
import { MaterialViewer } from "@/components/MaterialViewer";
import StudentReports from "@/components/StudentReports";
import { Button } from "@/components/ui/button";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { Text } from "@/components/ui/text";
import {
	attemptAPI,
	bookingAPI,
	materialAPI,
	materialProgressAPI,
	testAPI,
} from "@/lib/api";
import type { CourseMaterial, MaterialProgress, Test } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useTestStore } from "@/stores/testStore";

export default function TestDetailsPage() {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 11:00 AM");
	const isWeb = Platform.OS === "web";
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const user = useAuthStore((state) => state.user);
	const { showAlert } = useCustomAlert();

	// State for dynamic data
	const [test, setTest] = useState<Test | null>(null);
	const [materials, setMaterials] = useState<CourseMaterial[]>([]);
	const [materialProgress, setMaterialProgress] = useState<
		Map<number, MaterialProgress>
	>(new Map());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showEditTitleModal, setShowEditTitleModal] = useState(false);
	const [updatingTitle, setUpdatingTitle] = useState(false);
	const [deletingTest, setDeletingTest] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"materials" | "attempts" | "reports"
	>("materials");
	const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
	
	// Derived state: whether student has any passed attempt (for iCertification)
	const hasPassedAttempt = studentAttempts.some((a: any) => {
		if (a.status !== "submitted") return false;
		const percentage = Math.round((a.score / a.total_points) * 100);
		return percentage >= (test?.passing_score || 60);
	});
	
	const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
	const [bookedSlot, setBookedSlot] = useState<string | null>(null);
	const [booking, setBooking] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [selectedMaterial, setSelectedMaterial] =
		useState<CourseMaterial | null>(null);
	const [showMaterialViewer, setShowMaterialViewer] = useState(false);

	const screenWidth = Dimensions.get("window").width;
	const isLargeScreen = screenWidth > 1024;
	const isMediumScreen = screenWidth > 768;

	// Check if user is teacher or admin
	const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";
	const isAdmin = user?.role === "admin";

	// Fetch test details and materials
	const loadTestData = async () => {
		try {
			setLoading(true);
			setError(null);

			if (id) {
				// Fetch test details
				const testResponse = await testAPI.getById(Number(id));
				setTest(testResponse.data.test);

				// Fetch materials for this test
				try {
					const materialsResponse = await materialAPI.getByTest(Number(id));
					setMaterials(materialsResponse.data.materials || []);

					// Load material progress for students
					if (!isTeacherOrAdmin && user?.id) {
						try {
							const progressResponse = await materialProgressAPI.getProgress({
								material_type: "test",
							});
							const progressMap = new Map<number, MaterialProgress>();
							(progressResponse.data.progress || []).forEach(
								(p: MaterialProgress) => {
									progressMap.set(p.material_id, p);
								},
							);
							setMaterialProgress(progressMap);
						} catch (progressError) {
							console.error("Failed to load material progress:", progressError);
						}
					}
				} catch {
					showAlert("Error", "Failed to load materials for this test");
					setMaterials([]);
				}

				// If student, check their attempts and booking
				if (!isTeacherOrAdmin && user?.id) {
					try {
						const attemptsResponse = await attemptAPI.getStudentAttempts(
							user.id,
							Number(id),
						);
						const attempts = attemptsResponse.data.attempts || [];
						setStudentAttempts(attempts);

						// Check if max attempts reached
						const testData = testResponse.data.test;
						if (testData.max_attempts && testData.max_attempts > 0) {
							const completedAttempts = attempts.filter(
								(a: any) => a.status === "submitted",
							).length;
							setMaxAttemptsReached(completedAttempts >= testData.max_attempts);
						}

						// Check for existing booking
						try {
							const bookingsResponse = await bookingAPI.getMyBookings();
							const userBookings = bookingsResponse.data.bookings || [];
							const testBooking = userBookings.find(
								(b: any) => b.test_id === Number(id) && b.status === "booked",
							);
							if (testBooking) {
								setBookedSlot(testBooking.booked_slot);
							} else {
								setBookedSlot(null);
							}
						} catch {
							setBookedSlot(null);
						}
					} catch {
						showAlert("Error", "Could not load student attempts");
					}
				}
			}
		} catch {
			setError("Failed to load test data");
			showAlert("Error", "Failed to load test details. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (id) {
			loadTestData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// Update current time every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);

		return () => clearInterval(interval);
	}, []);

	// Handle title update
	const handleUpdateTitle = async (newTitle: string) => {
		try {
			setUpdatingTitle(true);
			await testAPI.update(Number(id), { title: newTitle });
			showAlert("Success", "Test title updated successfully!");
			setShowEditTitleModal(false);
			loadTestData();
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error || "Failed to update test title";
			showAlert("Error", errorMessage);
		} finally {
			setUpdatingTitle(false);
		}
	};

	// Handle test deletion
	const handleDeleteTest = () => {
		showAlert(
			"Delete Test",
			"Are you sure you want to delete this test? This will also delete all associated questions, materials, and student attempts. This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setDeletingTest(true);
							await testAPI.delete(Number(id));
							showAlert("Success", "Test deleted successfully!", [
								{
									text: "OK",
									onPress: () => router.back(),
								},
							]);
						} catch (error: any) {
							const errorMessage =
								error.response?.data?.error || "Failed to delete test";
							showAlert("Error", errorMessage);
						} finally {
							setDeletingTest(false);
						}
					},
				},
			],
		);
	};

	// Handle booking slot
	const handleBookSlot = async () => {
		try {
			setBooking(true);
			await bookingAPI.create({
				test_id: Number(id),
				booked_slot: selectedSlot,
			});
			setBookedSlot(selectedSlot);
			showAlert("Success", `Slot booked successfully: ${selectedSlot}`);
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || "Failed to book slot";
			showAlert("Error", errorMessage);
		} finally {
			setBooking(false);
		}
	};

	// Helper function to get relative time
	const getRelativeTime = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return date.toLocaleDateString();
	};

	// Helper function to check if current time is within booked slot
	const isWithinBookedSlot = (slot: string): boolean => {
		const now = currentTime;
		const [startStr, endStr] = slot.split(" - ");

		// Parse start time
		const startParts = startStr.split(" ");
		const startTime = startParts[0];
		const startPeriod = startParts[1];
		const [startHour, startMinute] = startTime.split(":").map(Number);
		const startHour24 =
			startPeriod === "PM" && startHour !== 12
				? startHour + 12
				: startPeriod === "AM" && startHour === 12
					? 0
					: startHour;

		// Parse end time
		const endParts = endStr.split(" ");
		const endTime = endParts[0];
		const endPeriod = endParts[1];
		const [endHour, endMinute] = endTime.split(":").map(Number);
		const endHour24 =
			endPeriod === "PM" && endHour !== 12
				? endHour + 12
				: endPeriod === "AM" && endHour === 12
					? 0
					: endHour;

		// Create Date objects for today
		const startDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			startHour24,
			startMinute,
		);
		const endDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			endHour24,
			endMinute,
		);

		return now >= startDate && now <= endDate;
	};

	// Navigate to certificate page
	const handleGetICertification = () => {
		if (!id) return;
		router.push(`/tests/certificate?testId=${id}` as any);
	};

	const MaterialCard = ({ material }: { material: CourseMaterial }) => {
		const progress = materialProgress.get(material.id);
		const isViewed = !!progress?.viewed_at;

		const getIcon = () => {
			const type = material.material_type || "document";
			switch (type.toLowerCase()) {
				case "video":
				case "mp4":
				case "avi":
				case "mov":
					return <Video size={20} color="#3b82f6" />;
				case "pdf":
					return <FileText size={20} color="#ef4444" />;
				case "code":
				case "programming":
					return <FileCode size={20} color="#8b5cf6" />;
				default:
					return <File size={20} color="#8b5cf6" />;
			}
		};

		const getTypeColor = () => {
			const type = material.material_type || "document";
			switch (type.toLowerCase()) {
				case "video":
					return "text-blue-500";
				case "pdf":
					return "text-red-500";
				case "code":
					return "text-purple-500";
				default:
					return "text-gray-500";
			}
		};

		const handleOpenMaterial = () => {
			setSelectedMaterial(material);
			setShowMaterialViewer(true);
		};

		const handleDownload = async () => {
			if (material.file_url) {
				try {
					const supported = await Linking.canOpenURL(material.file_url);
					if (supported) {
						await Linking.openURL(material.file_url);
						showAlert(
							"Download Started",
							`Opening ${material.title} for download`,
						);
					} else {
						showAlert(
							"Error",
							"Cannot download this material. The URL may be invalid.",
						);
					}
				} catch {
					showAlert("Error", "Failed to download material");
				}
			} else {
				showAlert("Not Available", "This material cannot be downloaded");
			}
		};

		const handleMarkViewed = () => {
			if (!user?.id) return;
			
			const newProgress: MaterialProgress = {
				id: materialProgress.get(material.id)?.id || 0,
				student_id: user.id,
				material_id: material.id,
				material_type: "test",
				viewed_at: new Date().toISOString(),
				completion_percentage: 100,
			};
			setMaterialProgress(
				new Map(materialProgress.set(material.id, newProgress)),
			);
			showAlert("Marked", `${material.title} marked as read`);
		};

		return (
			<View
				className={`rounded-xl p-4 ${
					isDark
						? "bg-gray-800 border border-gray-700"
						: "bg-white border border-gray-200"
				}`}
				style={{
					width: isWeb
						? isLargeScreen
							? "calc(33.333% - 11px)"
							: isMediumScreen
								? "calc(50% - 8px)"
								: "100%"
						: "100%",
					minHeight: 200,
				}}
			>
				<View className="flex-1">
					{/* Header */}
					<View className="flex-row items-start justify-between mb-3">
						<View className="flex-1 mr-2">
							<View className="flex-row items-center mb-2 flex-wrap">
								{getIcon()}
								<Text className={`ml-2 text-xs font-semibold ${getTypeColor()}`}>
									{(material.material_type || "document").toUpperCase()}
								</Text>
								{isViewed && !isTeacherOrAdmin && (
									<View
										className={`ml-2 px-2 py-0.5 rounded-full ${isDark ? "bg-green-900/30" : "bg-green-100"}`}
									>
										<View className="flex-row items-center">
											<CheckCircle2
												size={12}
												color={isDark ? "#86efac" : "#16a34a"}
											/>
											<Text
												className={`ml-1 text-xs font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}
											>
												Viewed
											</Text>
										</View>
									</View>
								)}
							</View>
							<Text
								className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
								numberOfLines={2}
							>
								{material.title}
							</Text>
							{material.description && (
								<Text
									className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
									numberOfLines={2}
								>
									{material.description}
								</Text>
							)}
						</View>
					</View>

					{/* Metadata */}
					<View className="flex-row items-center gap-3 mb-3 flex-wrap">
						<View className="flex-row items-center">
							<Clock size={12} color={isDark ? "#9ca3af" : "#6b7280"} />
							<Text
								className={`ml-1 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
							>
								{getRelativeTime(material.created_at || new Date().toISOString())}
							</Text>
						</View>
						{isViewed && progress?.viewed_at && !isTeacherOrAdmin && (
							<Text
								className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
							>
								Viewed {getRelativeTime(progress.viewed_at)}
							</Text>
						)}
					</View>

					{/* Actions */}
					<View className="flex-row gap-2 mt-auto flex-wrap">
						<View className="flex-1 min-w-[140px]">
							<Button
								onPress={handleOpenMaterial}
								variant="default"
								className="py-2.5 px-3 min-h-[44px] w-full"
							>
								<View className="flex-row items-center justify-center gap-2">
									{material.material_type?.toLowerCase().includes("video") ? (
										<PlayCircle size={16} color="white" />
									) : (
										<ExternalLink size={16} color="white" />
									)}
									<Text className="text-white font-semibold text-sm">
										{material.material_type?.toLowerCase().includes("video")
											? "Watch"
											: "View"}
									</Text>
								</View>
							</Button>
						</View>
						
						{material.file_url && (
							<Button
								onPress={handleDownload}
								variant="secondary"
								className="py-2.5 px-3 min-h-[44px]"
							>
								<Download size={16} color={isDark ? "#d1d5db" : "#374151"} />
							</Button>
						)}

						{!isTeacherOrAdmin && !isViewed && (
							<Button
								onPress={handleMarkViewed}
								variant="outline"
								className="py-2.5 px-3 min-h-[44px]"
							>
								<CheckCircle2 size={16} color={isDark ? "#d1d5db" : "#374151"} />
							</Button>
						)}
					</View>
				</View>
			</View>
		);
	};

	return (
		<View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
			<ScrollView 
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 24 }}
				showsVerticalScrollIndicator={true}
			>
				{/* Header */}
				<View className={`${isWeb ? "px-6 pt-6 lg:px-8 lg:pt-8" : "px-4 pt-6"} pb-4`}>
					<View className="flex-row items-start justify-between flex-wrap gap-4">
						<View className="flex-1 min-w-[250px]">
							<Text
								className={`text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
							>
								{test?.title || "Test Details"}
							</Text>
							<Text
								className={`mt-1 text-sm lg:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
							>
								{test?.description || "Materials and booking for this test"}
							</Text>

							{hasPassedAttempt && (
								<Pressable
									onPress={handleGetICertification}
									className="flex-row items-center mt-3"
								>
									<Shield size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
									<Text
										className={`ml-2 font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
									>
										View Certificate
									</Text>
								</Pressable>
							)}
						</View>

						{isTeacherOrAdmin && !loading && (
							<View className="flex-row gap-2 flex-wrap">
								<Button
									onPress={() => setShowEditTitleModal(true)}
									variant="secondary"
									className="p-3"
								>
									<Edit size={20} color={isDark ? "#60a5fa" : "#3b82f6"} />
								</Button>

								<Button
									onPress={() =>
										router.push({
											pathname: "/tests/questions/view-questions",
											params: { testId: id, testName: test?.title },
										} as any)
									}
									variant="secondary"
									className="flex-row items-center gap-2 px-4"
								>
									<List size={18} color={isDark ? "#c084fc" : "#9333ea"} />
									<Text
										className={`font-semibold text-sm ${isDark ? "text-purple-400" : "text-purple-600"}`}
									>
										Questions
									</Text>
								</Button>

								{isAdmin && (
									<Button
										onPress={handleDeleteTest}
										disabled={deletingTest}
										variant="destructive"
										className="p-3"
									>
										{deletingTest ? (
											<ActivityIndicator size="small" color="#ef4444" />
										) : (
											<Trash2 size={20} color="#ef4444" />
										)}
									</Button>
								)}
							</View>
						)}
					</View>
				</View>

				{/* Loading State */}
				{loading && (
					<View className="flex-1 items-center justify-center py-20">
						<ActivityIndicator size="large" color="#3b82f6" />
						<Text
							className={`mt-4 text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							Loading test details...
						</Text>
					</View>
				)}

				{/* Error State */}
				{error && !loading && (
					<View className="flex-1 items-center justify-center px-6 py-20">
						<View
							className={`rounded-xl p-6 max-w-md ${isDark ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}
						>
							<Text
								className={`text-lg font-bold mb-2 ${isDark ? "text-red-400" : "text-red-700"}`}
							>
								Failed to load test
							</Text>
							<Text
								className={`text-base mb-4 ${isDark ? "text-red-300" : "text-red-600"}`}
							>
								{error}
							</Text>
							<Button
								onPress={() => {
									setError(null);
									loadTestData();
								}}
								variant="default"
							>
								<Text className="text-white font-semibold text-center">
									Try Again
								</Text>
							</Button>
						</View>
					</View>
				)}

				{/* Content */}
				{!loading && !error && (
					<>
						{/* Test Info Card */}
						<View className={isWeb ? "px-6 lg:px-8 mb-6" : "px-4 mb-6"}>
							<View
								className={`rounded-xl p-5 ${
									isDark
										? "bg-gray-800 border border-gray-700"
										: "bg-white border border-gray-200"
								}`}
							>
								{/* Badges */}
								<View className="flex-row flex-wrap gap-2 mb-4">
									<View
										className={`px-3 py-1.5 rounded-full ${isDark ? "bg-blue-900/30" : "bg-blue-100"}`}
									>
										<Text
											className={`text-xs font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}
										>
											{test?.quiz_type?.toUpperCase() || "MIXED"}
										</Text>
									</View>
									<View
										className={`px-3 py-1.5 rounded-full ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}
									>
										<Text
											className={`text-xs font-semibold ${isDark ? "text-purple-300" : "text-purple-700"}`}
										>
											{test?.test_type
												? test.test_type.charAt(0).toUpperCase() +
													test.test_type.slice(1)
												: "Instant"}
										</Text>
									</View>
									<View
										className={`px-3 py-1.5 rounded-full ${isDark ? "bg-green-900/30" : "bg-green-100"}`}
									>
										<Text
											className={`text-xs font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}
										>
											⏱ {test?.duration_minutes} min
										</Text>
									</View>
									<View
										className={`px-3 py-1.5 rounded-full ${isDark ? "bg-yellow-900/30" : "bg-yellow-100"}`}
									>
										<Text
											className={`text-xs font-semibold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}
										>
											📝 {test?.total_marks} marks
										</Text>
									</View>
								</View>

								{/* Teacher/Admin Actions */}
								{isTeacherOrAdmin && (
									<View className="gap-3">
										<Button
											onPress={() =>
												router.push({
													pathname: "/courses/materials/add-material-to-test",
													params: { testId: id, testName: test?.title },
												} as any)
											}
											variant="outline"
											className="flex-row items-center justify-center py-3"
										>
											<Plus size={18} color={isDark ? "#60a5fa" : "#3b82f6"} />
											<Text
												className={`ml-2 font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
											>
												Add Materials
											</Text>
										</Button>

										<Button
											onPress={() =>
												router.push({
													pathname: "/tests/questions/add-questions",
													params: { testId: id, testName: test?.title },
												} as any)
											}
											variant="outline"
											className="flex-row items-center justify-center py-3"
										>
											<Edit size={18} color={isDark ? "#c084fc" : "#9333ea"} />
											<Text
												className={`ml-2 font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}
											>
												Add Questions
											</Text>
										</Button>
									</View>
								)}

								{/* Student Actions */}
								{!isTeacherOrAdmin && (
									<View className="gap-3">
										{hasPassedAttempt && (
											<Button
												onPress={handleGetICertification}
												variant="outline"
												className="flex-row items-center justify-center py-3"
											>
												<Shield size={18} color={isDark ? "#60a5fa" : "#3b82f6"} />
												<Text
													className={`ml-2 font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
												>
													Get iCertification
												</Text>
											</Button>
										)}

										{maxAttemptsReached ? (
											<View className="gap-3">
												{/* Max Attempts Warning */}
												<View
													className={`rounded-lg p-4 ${isDark ? "bg-yellow-900/30 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"}`}
												>
													<View className="flex-row items-center justify-center mb-2">
														<AlertTriangle
															size={20}
															color={isDark ? "#fbbf24" : "#f59e0b"}
														/>
														<Text
															className={`ml-2 font-bold text-center ${isDark ? "text-yellow-400" : "text-yellow-700"}`}
														>
															Max Attempts Reached ({test?.max_attempts})
														</Text>
													</View>
													<Text
														className={`text-center text-sm ${isDark ? "text-yellow-300" : "text-yellow-600"}`}
													>
														View your attempt history in Reports tab
													</Text>
												</View>

												{/* Quick view of attempts */}
												{studentAttempts
													.filter((a) => a.status === "submitted")
													.slice(0, 2)
													.map((attempt) => {
														const percentage = Math.round(
															(attempt.score / attempt.total_points) * 100,
														);
														const passed =
															percentage >= (test?.passing_score || 60);

														return (
															<Pressable
																key={attempt.id}
																onPress={() =>
																	router.push(
																		`/tests/review?attemptId=${attempt.id}` as any,
																	)
																}
																className={`rounded-lg p-4 border ${
																	passed
																		? isDark
																			? "bg-green-900/20 border-green-700"
																			: "bg-green-50 border-green-200"
																		: isDark
																			? "bg-red-900/20 border-red-700"
																			: "bg-red-50 border-red-200"
																}`}
															>
																<View className="flex-row items-center justify-between">
																	<View className="flex-1">
																		<View className="flex-row items-center gap-2 mb-1">
																			<Text
																				className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
																			>
																				Attempt #{attempt.attempt_number}
																			</Text>
																			<View
																				className={`px-2 py-0.5 rounded-full ${
																					passed
																						? isDark
																							? "bg-green-900/50"
																							: "bg-green-100"
																						: isDark
																							? "bg-red-900/50"
																							: "bg-red-100"
																				}`}
																			>
																				<Text
																					className={`text-xs font-bold ${
																						passed
																							? isDark
																								? "text-green-400"
																								: "text-green-700"
																							: isDark
																								? "text-red-400"
																								: "text-red-700"
																					}`}
																				>
																					{passed ? "✓ PASSED" : "✗ FAILED"}
																				</Text>
																			</View>
																		</View>
																		<Text
																			className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
																		>
																			Score: {attempt.score}/{attempt.total_points}
																		</Text>
																	</View>
																	<View className="items-end">
																		<Text
																			className={`text-2xl font-bold ${
																				passed
																					? isDark
																						? "text-green-400"
																						: "text-green-600"
																					: isDark
																						? "text-red-400"
																						: "text-red-600"
																			}`}
																		>
																			{percentage}%
																		</Text>
																		<ChevronRight
																			size={20}
																			color={isDark ? "#9ca3af" : "#6b7280"}
																		/>
																	</View>
																</View>
															</Pressable>
														);
													})}
											</View>
										) : (
											<>
												{/* Instant Test */}
												{(() => {
													const testType = test?.test_type?.toLowerCase();
													return (
														(!testType || testType === "instant") && (
															<Pressable
																onPress={() =>
																	router.push(`/tests/take-test?id=${id}`)
																}
																className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center active:bg-green-600"
															>
																<PlayCircle size={20} color="white" />
																<Text className="text-white font-bold text-center ml-2 text-lg">
																	Take Test Now
																</Text>
															</Pressable>
														)
													);
												})()}

												{/* Timed Test */}
												{(() => {
													const testType = test?.test_type?.toLowerCase();
													if (testType !== "timed") return null;

													const now = new Date();
													const startTime = test?.start_time
														? new Date(test.start_time)
														: null;
													const endTime = test?.end_time
														? new Date(test.end_time)
														: null;

													const isBeforeStart = startTime && now < startTime;
													const isAfterEnd = endTime && now > endTime;
													const isWithinWindow =
														startTime &&
														endTime &&
														now >= startTime &&
														now <= endTime;

													if (isBeforeStart) {
														return (
															<View
																className={`rounded-lg p-4 ${isDark ? "bg-yellow-900/30 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"}`}
															>
																<View className="flex-row items-center justify-center mb-2">
																	<Clock
																		size={20}
																		color={isDark ? "#fbbf24" : "#f59e0b"}
																	/>
																	<Text
																		className={`ml-2 font-bold ${isDark ? "text-yellow-400" : "text-yellow-700"}`}
																	>
																		Test Not Yet Available
																	</Text>
																</View>
																<Text
																	className={`text-center text-sm ${isDark ? "text-yellow-300" : "text-yellow-600"}`}
																>
																	Starts: {startTime?.toLocaleString()}
																</Text>
															</View>
														);
													}

													if (isAfterEnd) {
														return (
															<View
																className={`rounded-lg p-4 ${isDark ? "bg-red-900/30 border border-red-700" : "bg-red-50 border border-red-200"}`}
															>
																<View className="flex-row items-center justify-center mb-2">
																	<Clock size={20} color="#ef4444" />
																	<Text className="ml-2 font-bold text-red-500">
																		Test Window Closed
																	</Text>
																</View>
																<Text
																	className={`text-center text-sm ${isDark ? "text-red-300" : "text-red-600"}`}
																>
																	Ended: {endTime?.toLocaleString()}
																</Text>
															</View>
														);
													}

													if (isWithinWindow) {
														return (
															<Pressable
																onPress={() =>
																	router.push(`/tests/take-test?id=${id}`)
																}
																className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center active:bg-green-600"
															>
																<PlayCircle size={20} color="white" />
																<Text className="text-white font-bold text-center ml-2 text-lg">
																	Take Test Now
																</Text>
															</Pressable>
														);
													}

													return null;
												})()}

												{/* Booking Test */}
												{(() => {
													const testType = test?.test_type?.toLowerCase();
													if (testType !== "booking") return null;

													return (
														<View className="gap-3">
															{bookedSlot ? (
																<>
																	<View
																		className={`rounded-lg p-4 ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"}`}
																	>
																		<View className="flex-row items-center justify-center mb-2">
																			<Calendar
																				size={20}
																				color={isDark ? "#86efac" : "#16a34a"}
																			/>
																			<Text
																				className={`ml-2 font-bold ${isDark ? "text-green-400" : "text-green-700"}`}
																			>
																				Booked: {bookedSlot}
																			</Text>
																		</View>
																		<Text
																			className={`text-center text-sm ${isDark ? "text-green-300" : "text-green-600"}`}
																		>
																			Test available during this slot
																		</Text>
																	</View>

																	{isWithinBookedSlot(bookedSlot) ? (
																		<Pressable
																			onPress={() =>
																				router.push(`/tests/take-test?id=${id}`)
																			}
																			className="bg-green-500 rounded-lg py-4 flex-row items-center justify-center active:bg-green-600"
																		>
																			<PlayCircle size={20} color="white" />
																			<Text className="text-white font-bold text-center ml-2 text-lg">
																				Take Test Now
																			</Text>
																		</Pressable>
																	) : (
																		<View
																			className={`rounded-lg py-4 px-4 ${isDark ? "bg-yellow-900/30 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"}`}
																		>
																			<View className="flex-row items-center justify-center mb-2">
																				<Clock
																					size={20}
																					color={isDark ? "#fbbf24" : "#f59e0b"}
																				/>
																				<Text
																					className={`ml-2 font-bold ${isDark ? "text-yellow-400" : "text-yellow-700"}`}
																				>
																					Outside Booked Time
																				</Text>
																			</View>
																			<Text
																				className={`text-center text-sm ${isDark ? "text-yellow-300" : "text-yellow-600"}`}
																			>
																				Come back during: {bookedSlot}
																			</Text>
																		</View>
																	)}
																</>
															) : (
																<>
																	<View
																		className={`rounded-lg p-4 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
																	>
																		<Text
																			className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
																		>
																			Select Time Slot
																		</Text>
																		<View
																			className={`rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}
																		>
																			<Picker
																				selectedValue={selectedSlot}
																				onValueChange={(value) =>
																					setSelectedSlot(value)
																				}
																				style={{
																					color: isDark ? "#fff" : "#000",
																					backgroundColor: "transparent",
																				}}
																			>
																				<Picker.Item
																					label="10:00 AM - 11:00 AM"
																					value="10:00 AM - 11:00 AM"
																				/>
																				<Picker.Item
																					label="11:00 AM - 12:00 PM"
																					value="11:00 AM - 12:00 PM"
																				/>
																				<Picker.Item
																					label="02:00 PM - 03:00 PM"
																					value="02:00 PM - 03:00 PM"
																				/>
																				<Picker.Item
																					label="03:00 PM - 04:00 PM"
																					value="03:00 PM - 04:00 PM"
																				/>
																			</Picker>
																		</View>
																	</View>

																	<Button
																		onPress={handleBookSlot}
																		disabled={booking}
																		variant="default"
																		className="rounded-lg py-4"
																	>
																		<View className="flex-row items-center justify-center">
																			{booking ? (
																				<ActivityIndicator
																					size="small"
																					color="white"
																				/>
																			) : (
																				<Calendar size={20} color="white" />
																			)}
																			<Text className="text-white font-bold ml-2 text-lg">
																				{booking ? "Booking..." : "Book Slot"}
																			</Text>
																		</View>
																	</Button>
																</>
															)}
														</View>
													);
												})()}
											</>
										)}
									</View>
								)}
							</View>
						</View>

						{/* Tabs */}
						<View
							className={`flex-row border-b ${isDark ? "border-gray-700" : "border-gray-200"} ${isWeb ? "px-6 lg:px-8" : "px-4"}`}
						>
							<Pressable
								onPress={() => setActiveTab("materials")}
								className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${
									activeTab === "materials"
										? isDark
											? "border-blue-500"
											: "border-blue-600"
										: "border-transparent"
								}`}
							>
								<FileText
									size={20}
									color={
										activeTab === "materials"
											? isDark
												? "#60a5fa"
												: "#2563eb"
											: isDark
												? "#6b7280"
												: "#9ca3af"
									}
								/>
								<Text
									className={`font-semibold ${
										activeTab === "materials"
											? isDark
												? "text-blue-400"
												: "text-blue-600"
											: isDark
												? "text-gray-400"
												: "text-gray-600"
									}`}
								>
									Materials
								</Text>
							</Pressable>

							{isTeacherOrAdmin ? (
								<Pressable
									onPress={() => setActiveTab("attempts")}
									className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${
										activeTab === "attempts"
											? isDark
												? "border-green-500"
												: "border-green-600"
											: "border-transparent"
									}`}
								>
									<Activity
										size={20}
										color={
											activeTab === "attempts"
												? isDark
													? "#86efac"
													: "#16a34a"
												: isDark
													? "#6b7280"
													: "#9ca3af"
										}
									/>
									<Text
										className={`font-semibold ${
											activeTab === "attempts"
												? isDark
													? "text-green-400"
													: "text-green-600"
												: isDark
													? "text-gray-400"
													: "text-gray-600"
										}`}
									>
										Attempters
									</Text>
								</Pressable>
							) : (
								<Pressable
									onPress={() => setActiveTab("reports")}
									className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${
										activeTab === "reports"
											? isDark
												? "border-purple-500"
												: "border-purple-600"
											: "border-transparent"
									}`}
								>
									<Activity
										size={20}
										color={
											activeTab === "reports"
												? isDark
													? "#c4b5fd"
													: "#7c3aed"
												: isDark
													? "#6b7280"
													: "#9ca3af"
										}
									/>
									<Text
										className={`font-semibold ${
											activeTab === "reports"
												? isDark
													? "text-purple-400"
													: "text-purple-600"
												: isDark
													? "text-gray-400"
													: "text-gray-600"
										}`}
									>
										My Reports
									</Text>
								</Pressable>
							)}
						</View>

						{/* Tab Content */}
						<View className={`${isWeb ? "px-6 lg:px-8" : "px-4"} py-6`}>
							{activeTab === "materials" && (
								<View>
									<View className="flex-row items-center justify-between mb-4">
										<Text
											className={`text-xl lg:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
										>
											Test Materials
										</Text>
										{isTeacherOrAdmin && (
											<Pressable
												onPress={() =>
													router.push({
														pathname: "/courses/materials/add-material-to-test",
														params: { testId: id, testName: test?.title },
													} as any)
												}
												className="flex-row items-center"
											>
												<PlusCircle
													size={20}
													color={isDark ? "#60a5fa" : "#3b82f6"}
												/>
												<Text
													className={`ml-2 font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
												>
													Add
												</Text>
											</Pressable>
										)}
									</View>

									<View
										className="flex-row flex-wrap"
										style={{
											gap: isWeb ? (isLargeScreen ? 16 : 12) : 12,
										}}
									>
										{materials.length > 0 ? (
											materials.map((material) => (
												<MaterialCard key={material.id} material={material} />
											))
										) : (
											<View className="w-full items-center py-12">
												<FileText
													size={48}
													color={isDark ? "#6b7280" : "#9ca3af"}
												/>
												<Text
													className={`mt-4 text-lg font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
												>
													No materials available
												</Text>
												<Text
													className={`mt-2 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
												>
													{isTeacherOrAdmin
														? "Add materials to help students"
														: "Check back later"}
												</Text>
											</View>
										)}
									</View>
								</View>
							)}

							{activeTab === "attempts" && isTeacherOrAdmin && (
								<LiveAttempts
									testId={Number(id)}
									autoRefresh={true}
									refreshInterval={10}
								/>
							)}

							{activeTab === "reports" && !isTeacherOrAdmin && (
								<StudentReports testId={Number(id)} studentId={user?.id || 0} />
							)}
						</View>
					</>
				)}
			</ScrollView>

			{/* Modals */}
			{test && (
				<EditTestTitleModal
					visible={showEditTitleModal}
					currentTitle={test.title}
					onClose={() => setShowEditTitleModal(false)}
					onSave={handleUpdateTitle}
					loading={updatingTitle}
				/>
			)}

			<MaterialViewer
				visible={showMaterialViewer}
				material={selectedMaterial}
				materialType="test"
				onClose={() => {
					setShowMaterialViewer(false);
					setSelectedMaterial(null);
				}}
				onMarkViewed={() => {
					if (selectedMaterial && user?.id) {
						const newProgress: MaterialProgress = {
							id: materialProgress.get(selectedMaterial.id)?.id || 0,
							student_id: user.id,
							material_id: selectedMaterial.id,
							material_type: "test",
							viewed_at: new Date().toISOString(),
							completion_percentage: 100,
						};
						setMaterialProgress(
							new Map(materialProgress.set(selectedMaterial.id, newProgress)),
						);
					}
				}}
			/>
		</View>
	);
}