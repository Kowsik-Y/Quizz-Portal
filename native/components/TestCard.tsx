import React from "react";
import { View, Pressable, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	BookOpen,
	Clock,
	FileText,
	Calendar,
	PlayCircle,
	AlertCircle,
	Code2,
	Award,
	Shield,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { showToast } from "@/lib/toast";
import { useColorScheme } from "nativewind";

interface TestCardProps {
	test: any;
	canTakeTest: boolean;
	isCompleted: boolean;
	maxAttemptsReached: boolean;
	testType: string;
	numColumns?: number;
	width?: number | string;
}

export const TestCard: React.FC<TestCardProps> = ({
	test,
	canTakeTest,
	isCompleted,
	width,
	maxAttemptsReached,
	testType,
	numColumns = 1,
}) => {
	const { colorScheme: theme } = useColorScheme();
	const isDark = theme === "dark";
	const router = useRouter();
	const isWeb = Platform.OS === "web";

	// Get quiz type (code/mcq/etc)
	const quizType = test.quiz_type || "mixed";
	const isCodeQuiz = quizType === "code";

	// Check if test has security features enabled
	const hasSecurityFeatures =
		test.detect_window_switch ||
		test.prevent_screenshot ||
		test.detect_phone_call;

	const getTypeConfig = () => {
		const type = testType.toLowerCase();
		switch (type) {
			case "instant":
				return {
					bgColor: "bg-green-100",
					textColor: "text-green-700",
					label: "Instant",
				};
			case "booking":
				return {
					bgColor: "bg-blue-100",
					textColor: "text-blue-700",
					label: "Booking Required",
				};
			default:
				return {
					bgColor: "bg-yellow-100",
					textColor: "text-yellow-700",
					label: "Timed",
				};
		}
	};

	const typeConfig = getTypeConfig();

	const handleTakeTest = (e: any) => {
		e?.stopPropagation?.();

		if (!test.is_active) {
			showToast.error("This test is currently not active", {
				title: "Test Inactive",
			});
			return;
		}

		if (canTakeTest) {
			router.push(`/tests/take-test?id=${test.id}` as any);
		} else if (testType === "booking") {
			showToast.warning("Please book a slot first", {
				title: "Booking Required",
			});
			router.push(`/tests/book-test?id=${test.id}` as any);
		} else {
			showToast.error("Test is not available at this time", {
				title: "Cannot Take Test",
			});
		}
	};

	return (
		<Pressable
			onPress={() => router.push(`/tests/test-details?id=${test.id}` as any)}
			accessibilityRole="button"
			accessibilityLabel={`test card for ${test.title}`}
			hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			className={`rounded-2xl px-5 py-4 mb-4 ${isDark ? "bg-card" : "bg-white"} border ${isDark ? "border-border" : "border-gray-200"}`}
			style={{
				width: isWeb
					? numColumns === 3
						? "32%"
						: numColumns === 2
							? "50%"
							: "100%"
					: "100%",
				opacity: 1,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: isDark ? 0.3 : 0.01,
				shadowRadius: 4,
				elevation: 3,
			}}
		>
			{/* Header */}
			<View className="flex-row items-start justify-between mb-3">
				<View className="flex-1 pr-2">
					<View className="flex-row items-center gap-2 mb-1 flex-wrap">
						<Text
							className={`${isWeb ? "text-lg" : "text-base"} font-bold ${isDark ? "text-white" : "text-gray-900"}`}
							numberOfLines={2}
						>
							{test.title}
						</Text>
						{isCodeQuiz && (
							<Badge
								variant="secondary"
								size="sm"
								className="py-1 px-2 rounded-lg"
							>
								<Code2 size={14} />
							</Badge>
						)}
					</View>
					<Text className="text-xs text-blue-500 font-medium mb-1">
						{test.course_title}
					</Text>
					<Text className="text-sm text-muted-foreground" numberOfLines={2}>
						{test.description}
					</Text>
				</View>

				{/* Status Badges */}
				<View className="gap-1">
					{maxAttemptsReached && (
						<Badge
							variant="warning"
							size="sm"
							className={`${isWeb ? "py-1.5 px-3" : "py-1 px-2"}`}
						>
							<Text className={isWeb ? "text-xs" : "text-[10px]"}>Max</Text>
						</Badge>
					)}
					{!test.is_active && (
						<Badge
							variant="danger"
							size="sm"
							className={`${isWeb ? "py-1.5 px-3" : "py-1 px-2"}`}
						>
							<Text className={isWeb ? "text-xs" : "text-[10px]"}>Off</Text>
						</Badge>
					)}
				</View>
			</View>

			{/* Test Info */}
			<View
				className={`flex-row items-center flex-wrap ${isWeb ? "gap-3" : "gap-2"} mb-4`}
			>
				<View className="flex-row items-center">
					<BookOpen size={isWeb ? 14 : 12} color="#6b7280" />
					<Text
						className={`ml-1.5 ${isWeb ? "text-xs" : "text-[11px]"} text-muted-foreground`}
					>
						{test.question_count || 0} questions
					</Text>
				</View>
				<View className="flex-row items-center">
					<Clock size={isWeb ? 14 : 12} color="#6b7280" />
					<Text
						className={`ml-1.5 ${isWeb ? "text-xs" : "text-[11px]"} text-muted-foreground`}
					>
						{test.duration_minutes} min
					</Text>
				</View>
				{test.passing_score && (
					<View className="flex-row items-center">
						<Award size={isWeb ? 14 : 12} color="#10b981" />
						<Text
							className={`ml-1.5 ${isWeb ? "text-xs" : "text-[11px]"} text-green-600`}
						>
							Pass: {test.passing_score}%
						</Text>
					</View>
				)}
				{hasSecurityFeatures && (
					<View className="flex-row items-center">
						<Shield size={isWeb ? 14 : 12} color="#f59e0b" />
						<Text
							className={`ml-1.5 ${isWeb ? "text-xs" : "text-[11px]"} text-amber-600`}
						>
							Monitored
						</Text>
					</View>
				)}
			</View>

			{/* Type and Attempts Badge */}
			<View className="flex-row items-center gap-2 mb-3 flex-wrap">
				<Badge
					variant={
						testType === "instant"
							? "success"
							: testType === "booking"
								? "info"
								: "warning"
					}
					size="sm"
					className={`${isWeb ? "py-1.5 px-3" : "py-1 px-2"}`}
				>
					<Text className={isWeb ? "text-xs" : "text-[11px]"}>
						{typeConfig.label}
					</Text>
				</Badge>
				{test.max_attempts && !maxAttemptsReached && (
					<Badge
						variant="secondary"
						size="sm"
						className={`${isWeb ? "py-1.5 px-3" : "py-1 px-2"}`}
					>
						<Text className={isWeb ? "text-xs" : "text-[11px]"}>
							Max {test.max_attempts} attempts
						</Text>
					</Badge>
				)}
			</View>

			{/* Action Buttons */}
			<View className="gap-2 mb-3">
				{/* Materials Button */}
				<Button
					onPress={(e: any) => {
						e?.stopPropagation?.();
						router.push(`/tests/test-details?id=${test.id}` as any);
					}}
					variant="outline"
					size={isWeb ? "lg" : "default"}
				>
					<FileText size={isWeb ? 16 : 14} color="#3b82f6" />
					<Text
						className={
							isWeb
								? `text-sm ${isDark ? "text-white" : "text-gray-900"}`
								: "text-xs text-primary"
						}
					>
						Materials
					</Text>
				</Button>

				{/* Book Slot Button - Only for booking type tests */}
				{testType === "booking" && (
					<Button
						onPress={(e: any) => {
							e?.stopPropagation?.();
							router.push(`/tests/book-test?id=${test.id}` as any);
						}}
						variant="outline"
						size={isWeb ? "lg" : "default"}
					>
						<Calendar
							size={isWeb ? 16 : 14}
							className="text-purple-500 dark:text-purple-400"
						/>
						<Text
							className={`font-semibold text-purple-500 dark:text-purple-400 ${isWeb ? "text-sm" : "text-xs"}`}
						>
							Book Slot
						</Text>
					</Button>
				)}
			</View>

			{/* Take Test / Review Buttons */}
			<View className="flex-row gap-2">
				{maxAttemptsReached ? (
					<View className="flex-1">
						<View
							className={`bg-orange-50 dark:bg-orange-50/5 border border-orange-200 dark:border-orange-700 rounded-lg ${isWeb ? "p-3" : "p-2"} mb-2`}
						>
							<View className="flex-row items-center mb-1">
								<AlertCircle size={isWeb ? 16 : 14} color="#f97316" />
								<Text
									className={`${isWeb ? "text-sm" : "text-xs"} font-medium text-orange-600 ml-1 `}
								>
									Maximum Attempts Reached
								</Text>
							</View>
							<Text
								className={`${isWeb ? "text-xs" : "text-[11px]"} text-orange-500`}
							>
								You&apos;ve completed all {test.max_attempts} attempts for this
								test
							</Text>
						</View>
						<Button
							onPress={(e: any) => {
								e?.stopPropagation?.();
								router.push(`/tests/test-details?id=${test.id}` as any);
							}}
							variant="info"
							size={isWeb ? "lg" : "default"}
						>
							<Text className={isWeb ? "text-sm" : "text-xs"}>
								View Reports
							</Text>
						</Button>
					</View>
				) : (
					<Button
						onPress={handleTakeTest}
						disabled={!test.is_active}
						variant={canTakeTest && test.is_active ? "success" : "ghost"}
						size={isWeb ? "lg" : "default"}
						className="flex-1"
					>
						{canTakeTest && test.is_active ? (
							<>
								<PlayCircle size={isWeb ? 18 : 16} color="white" />
								<Text className={`text-white ${isWeb ? "text-sm" : "text-xs"}`}>
									{isCodeQuiz ? "Start Coding" : "Take Test"}
								</Text>
							</>
						) : (
							<>
								<AlertCircle size={isWeb ? 18 : 16} color="white" />
								<Text className={`text-white ${isWeb ? "text-sm" : "text-xs"}`}>
									{!test.is_active ? "Inactive" : "Book Slot"}
								</Text>
							</>
						)}
					</Button>
				)}
			</View>
		</Pressable>
	);
};

export default TestCard;
