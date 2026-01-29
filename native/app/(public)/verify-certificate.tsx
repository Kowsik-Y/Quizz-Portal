import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Award,
	BookOpen,
	Calendar,
	CheckCircle2,
	TrendingUp,
	User,
	XCircle,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	ScrollView,
	TextInput,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { Text } from "@/components/ui/text";
import { certificateAPI } from "@/lib/api";

export default function VerifyCertificatePage() {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const { code } = useLocalSearchParams<{ code?: string }>();
	const router = useRouter();
	const { showAlert } = useCustomAlert();

	const [certificateCode, setCertificateCode] = useState(code || "");
	const [loading, setLoading] = useState(false);
	const [certificate, setCertificate] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (code) {
			verifyCertificate(code);
		}
	}, [code]);

	const verifyCertificate = async (codeToVerify?: string) => {
		const codeToCheck = codeToVerify || certificateCode.trim();

		if (!codeToCheck) {
			setError("Please enter a certificate code");
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const response = await certificateAPI.verify(codeToCheck);

			if (response.data.valid) {
				setCertificate(response.data.certificate);
			} else {
				setError(response.data.reason || "Invalid certificate code");
				setCertificate(null);
			}
		} catch (error: any) {
			console.error("Verification error:", error);
			setError(error.response?.data?.error || "Failed to verify certificate");
			setCertificate(null);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
			<ScrollView className="flex-1" contentContainerClassName="p-6">
				{/* Header */}
				<View className="items-center mb-8">
					<Award size={64} color={isDark ? "#fbbf24" : "#f59e0b"} />
					<Text
						className={`text-3xl font-bold mt-4 ${isDark ? "text-white" : "text-gray-900"}`}
					>
						Verify Certificate
					</Text>
					<Text
						className={`text-base mt-2 text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
					>
						Enter a certificate code to verify its authenticity
					</Text>
				</View>

				{/* Input Section */}
				<View
					className={`rounded-xl p-6 mb-6 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
				>
					<Text
						className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
					>
						Certificate Code
					</Text>
					<TextInput
						value={certificateCode}
						onChangeText={setCertificateCode}
						placeholder="CERT-123-456-..."
						placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
						className={`px-4 py-3 rounded-lg border mb-4 ${
							isDark
								? "bg-gray-700 border-gray-600 text-white"
								: "bg-white border-gray-300 text-gray-900"
						}`}
						autoCapitalize="characters"
						editable={!loading}
					/>
					<Button
						onPress={() => verifyCertificate()}
						variant="default"
						className="py-3"
						disabled={loading || !certificateCode.trim()}
					>
						{loading ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<Text className="text-white font-semibold text-base">
								Verify Certificate
							</Text>
						)}
					</Button>
				</View>

				{/* Error State */}
				{error && !loading && (
					<View
						className={`rounded-xl p-6 mb-6 ${isDark ? "bg-red-900/30 border border-red-700" : "bg-red-50 border border-red-200"}`}
					>
						<View className="flex-row items-center mb-2">
							<XCircle size={24} color={isDark ? "#f87171" : "#dc2626"} />
							<Text
								className={`ml-2 text-lg font-bold ${isDark ? "text-red-400" : "text-red-700"}`}
							>
								Verification Failed
							</Text>
						</View>
						<Text
							className={`text-base ${isDark ? "text-red-300" : "text-red-600"}`}
						>
							{error}
						</Text>
					</View>
				)}

				{/* Certificate Display */}
				{certificate && !loading && (
					<View
						className={`rounded-2xl p-8 mb-6 ${isDark ? "bg-gray-800 border-2 border-green-500" : "bg-gradient-to-br from-green-50 to-white border-2 border-green-400"}`}
					>
						<View className="items-center mb-6">
							<CheckCircle2 size={80} color={isDark ? "#86efac" : "#16a34a"} />
						</View>

						<Text
							className={`text-center text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
						>
							✓ Certificate Verified
						</Text>

						{/* Certificate Details */}
						<View
							className={`rounded-xl p-5 mb-4 ${isDark ? "bg-gray-700/50" : "bg-white/50"}`}
						>
							<View className="gap-4">
								<View className="flex-row items-start">
									<User size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
									<View className="ml-3 flex-1">
										<Text
											className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											Student Name
										</Text>
										<Text
											className={`text-base font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
										>
											{certificate.student_name}
										</Text>
									</View>
								</View>

								<View className="flex-row items-start">
									<BookOpen size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
									<View className="ml-3 flex-1">
										<Text
											className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											Test
										</Text>
										<Text
											className={`text-base font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
										>
											{certificate.test_title}
										</Text>
										{certificate.test_description && (
											<Text
												className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
											>
												{certificate.test_description}
											</Text>
										)}
									</View>
								</View>

								{certificate.percentage !== undefined && (
									<View className="flex-row items-start">
										<TrendingUp
											size={20}
											color={isDark ? "#9ca3af" : "#6b7280"}
										/>
										<View className="ml-3 flex-1">
											<Text
												className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
											>
												Score
											</Text>
											<View className="flex-row items-baseline mt-1">
												<Text
													className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}
												>
													{certificate.percentage}%
												</Text>
												<Text
													className={`ml-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
												>
													({certificate.score}/{certificate.total_points}{" "}
													points)
												</Text>
											</View>
										</View>
									</View>
								)}

								<View className="flex-row items-start">
									<Calendar size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
									<View className="ml-3 flex-1">
										<Text
											className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											Issued On
										</Text>
										<Text
											className={`text-base font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
										>
											{new Date(certificate.issued_at).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												},
											)}
										</Text>
									</View>
								</View>

								<View className="pt-4 border-t border-gray-300">
									<Text
										className={`text-xs font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Certificate Code: {certificate.certificate_code}
									</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Back Button */}
				<Button
					onPress={() => router.back()}
					variant="outline"
					className="mt-4"
				>
					<Text
						className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
					>
						Go Back
					</Text>
				</Button>
			</ScrollView>
		</View>
	);
}
