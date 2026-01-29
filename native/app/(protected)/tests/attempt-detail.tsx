import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { attemptAPI } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";

type AttemptDetail = {
	id: number;
	test_id: number;
	test_title?: string;
	student_id: number;
	student_name?: string;
	student_email?: string;
	student_roll_number?: string;
	status: "in_progress" | "submitted";
	score: number;
	total_points: number;
	percentage?: number;
	platform?: string;
	browser?: string;
	started_at?: string;
	submitted_at?: string | null;
	violation_count?: number;
	total_questions?: number;
	questions_attempted?: number;
	attempt_number?: number;
	violations?: Array<{
		id: number;
		violation_type: string;
		details: any;
		created_at: string;
	}>;
};

type AttemptReview = {
	attempt: {
		id: number;
		test_id: number;
		test_title?: string;
		status: string;
		score: number;
		total_points: number;
		percentage?: number;
		started_at?: string;
		submitted_at?: string | null;
	};
	answers: Array<{
		id: number;
		question_id: number;
		question_text: string;
		question_type: string;
		points_earned: number;
		is_correct: boolean | null;
		is_flagged: boolean | null;
	}>;
};

export default function AttemptDetailPage() {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const router = useRouter();
	const params = useLocalSearchParams();
	const user = useAuthStore((s) => s.user);

	const attemptId = useMemo(() => {
		const raw = params.attemptId;
		const asString = Array.isArray(raw) ? raw[0] : raw;
		const n = asString ? Number(asString) : NaN;
		return Number.isFinite(n) ? n : null;
	}, [params.attemptId]);

	const [loading, setLoading] = useState(true);
	const [detail, setDetail] = useState<AttemptDetail | null>(null);
	const [review, setReview] = useState<AttemptReview | null>(null);
	const [error, setError] = useState<string | null>(null);

	const canView =
		user?.role === "admin" ||
		user?.role === "teacher" ||
		user?.role === "student";

	useEffect(() => {
		const load = async () => {
			if (!attemptId) {
				setError("Invalid attempt id");
				setLoading(false);
				return;
			}
			if (!canView) {
				setError("Access denied");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				const [detailRes, reviewRes] = await Promise.all([
					attemptAPI.getAttemptDetail(attemptId),
					attemptAPI.getReview(attemptId),
				]);

				setDetail(detailRes.data as AttemptDetail);
				setReview(reviewRes.data as AttemptReview);
			} catch (e: any) {
				const status = e?.response?.status;
				if (status === 403) {
					setError("Access denied");
					showToast.warning("You do not have permission to view this attempt", {
						title: "Access Denied",
					});
				} else {
					setError("Failed to load attempt details");
					showToast.error("Failed to load attempt details", { title: "Error" });
				}
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [attemptId, canView]);

	const formatDateTime = (value?: string | null) => {
		if (!value) return "—";
		const d = new Date(value);
		return d.toLocaleString();
	};

	if (loading) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			>
				<ActivityIndicator
					size="large"
					color={isDark ? "#60a5fa" : "#3b82f6"}
				/>
				<Text className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
					Loading attempt…
				</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View
				className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			>
				<Text
					className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
				>
					{error}
				</Text>
				<Pressable
					onPress={() => router.back()}
					className={`mt-4 rounded-lg px-4 py-3 ${isDark ? "bg-gray-800" : "bg-white"}`}
				>
					<Text className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>
						Go Back
					</Text>
				</Pressable>
			</View>
		);
	}

	const status = detail?.status || review?.attempt?.status;
	const score = review?.attempt?.score ?? detail?.score ?? 0;
	const total = review?.attempt?.total_points ?? detail?.total_points ?? 0;
	const pct = total > 0 ? Math.round((score / total) * 100) : 0;

	const violations = detail?.violations || [];
	const answers = review?.answers || [];

	return (
		<View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ padding: 16, gap: 12 }}
			>
				<View
					className={`rounded-xl p-4 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
				>
					<Text
						className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
					>
						{detail?.test_title ||
							review?.attempt?.test_title ||
							"Attempt Details"}
					</Text>

					<View className="mt-2 flex-row items-center justify-between">
						<Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
							{detail?.student_name || "Student"}
							{detail?.student_roll_number
								? ` • ${detail.student_roll_number}`
								: ""}
						</Text>

						<View
							className={`px-3 py-1 rounded-full ${
								status === "submitted"
									? isDark
										? "bg-blue-900/30"
										: "bg-blue-100"
									: isDark
										? "bg-green-900/30"
										: "bg-green-100"
							}`}
						>
							<Text
								className={`text-xs font-semibold ${
									status === "submitted"
										? isDark
											? "text-blue-300"
											: "text-blue-700"
										: isDark
											? "text-green-300"
											: "text-green-700"
								}`}
							>
								{status === "submitted" ? "✅ Submitted" : "🟢 In progress"}
							</Text>
						</View>
					</View>

					{detail?.student_email ? (
						<Text
							className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
						>
							{detail.student_email}
						</Text>
					) : null}

					<View
						className={`mt-3 rounded-lg p-3 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}
					>
						<View className="flex-row items-center justify-between">
							<Text className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
								Score
							</Text>
							<Text
								className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
							>
								{score}/{total}
							</Text>
						</View>
						<View className="mt-1 flex-row items-center justify-between">
							<Text className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
								Percentage
							</Text>
							<Text className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>
								{pct}%
							</Text>
						</View>
					</View>

					<View className="mt-3">
						<Text className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
							Started:{" "}
							{formatDateTime(
								detail?.started_at || review?.attempt?.started_at,
							)}
						</Text>
						<Text className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
							Submitted:{" "}
							{formatDateTime(
								detail?.submitted_at || review?.attempt?.submitted_at,
							)}
						</Text>
						<Text className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
							Platform: {detail?.platform || "—"} • Browser:{" "}
							{detail?.browser || "—"}
						</Text>
					</View>
				</View>

				<View
					className={`rounded-xl p-4 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Shield size={18} color={isDark ? "#f87171" : "#ef4444"} />
							<Text
								className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
							>
								Violations
							</Text>
						</View>
						<Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
							{violations.length}
						</Text>
					</View>

					{violations.length === 0 ? (
						<Text
							className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							No violations recorded.
						</Text>
					) : (
						<View className="mt-3 gap-2">
							{violations.map((v) => (
								<View
									key={v.id}
									className={`rounded-lg p-3 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}
								>
									<Text
										className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
									>
										{v.violation_type}
									</Text>
									<Text
										className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
									>
										{formatDateTime(v.created_at)}
									</Text>
									{v.details ? (
										<Text
											className={`mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											{typeof v.details === "string"
												? v.details
												: JSON.stringify(v.details)}
										</Text>
									) : null}
								</View>
							))}
						</View>
					)}
				</View>

				<View
					className={`rounded-xl p-4 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
				>
					<View className="flex-row items-center justify-between">
						<Text
							className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
						>
							Answers
						</Text>
						<Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
							{answers.length}
						</Text>
					</View>

					{answers.length === 0 ? (
						<Text
							className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							No answers found.
						</Text>
					) : (
						<View className="mt-3 gap-2">
							{answers.map((a) => (
								<View
									key={a.id}
									className={`rounded-lg p-3 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}
								>
									<Text
										className={`${isDark ? "text-white" : "text-gray-900"}`}
										numberOfLines={2}
									>
										{a.question_text}
									</Text>
									<View className="mt-2 flex-row items-center justify-between">
										<Text
											className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											{a.question_type.toUpperCase()}
											{a.is_correct === true
												? " • Correct"
												: a.is_correct === false
													? " • Wrong"
													: ""}
										</Text>
										<Text
											className={`text-xs font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
										>
											+{a.points_earned}
										</Text>
									</View>
								</View>
							))}
						</View>
					)}

					<Pressable
						onPress={() =>
							router.push(`/tests/review?attemptId=${attemptId}` as any)
						}
						className={`mt-4 rounded-lg py-3 flex-row items-center justify-center gap-2 ${
							isDark
								? "bg-blue-900/30 border border-blue-700"
								: "bg-blue-50 border border-blue-200"
						}`}
					>
						<Text
							className={`font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}
						>
							Open Review Page
						</Text>
						<ChevronRight size={18} color={isDark ? "#93c5fd" : "#2563eb"} />
					</Pressable>
				</View>
			</ScrollView>
		</View>
	);
}
