import { useRouter } from "expo-router";
import {
	Award,
	Calendar,
	CheckCircle2,
	Download,
	Share2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { Text } from "@/components/ui/text";
import { certificateAPI } from "@/lib/api";
import type { Certificate } from "@/lib/types";

interface CertificateListProps {
	studentId?: number;
}

export function CertificateList({ studentId }: CertificateListProps) {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const [loading, setLoading] = useState(true);
	const { showAlert } = useCustomAlert();
	const router = useRouter();

	const screenWidth = Dimensions.get("window").width;
	const isLargeScreen = screenWidth > 1024;
	const isMediumScreen = screenWidth > 768;

	useEffect(() => {
		loadCertificates();
	}, []);

	const loadCertificates = async () => {
		try {
			setLoading(true);
			const response = await certificateAPI.getMyCertificates();
			setCertificates(response.data.certificates || []);
		} catch (error: any) {
			console.error("Failed to load certificates:", error);
			showAlert("Error", "Failed to load certificates");
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async (certificate: Certificate) => {
		try {
			const response = await certificateAPI.download(certificate.id);
			if (response.data.pdf_url) {
				const canOpen = await Linking.canOpenURL(response.data.pdf_url);
				if (canOpen) {
					await Linking.openURL(response.data.pdf_url);
				} else {
					showAlert("Error", "Cannot open PDF URL");
				}
			} else {
				showAlert("Info", "PDF generation will be available soon");
			}
		} catch (error: any) {
			console.error("Failed to download certificate:", error);
			showAlert("Error", "Failed to download certificate");
		}
	};

	const handleView = (certificate: Certificate) => {
		router.push({
			pathname: "/certificates/view",
			params: { id: certificate.id.toString() },
		} as any);
	};

	const handleShare = async (certificate: Certificate) => {
		try {
			const verificationUrl =
				certificate.verification_url ||
				`${process.env.EXPO_PUBLIC_API_URL?.replace("/api", "")}/verify-certificate?code=${certificate.certificate_code}`;

			if (Platform.OS === "web") {
				await navigator.clipboard.writeText(verificationUrl);
				showAlert("Success", "Verification link copied to clipboard");
			} else {
				// Use expo-sharing if available
				showAlert("Info", `Verification Code: ${certificate.certificate_code}`);
			}
		} catch (error) {
			showAlert("Error", "Failed to share certificate");
		}
	};

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center py-20">
				<ActivityIndicator size="large" color="#3b82f6" />
				<Text
					className={`mt-4 text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
				>
					Loading certificates...
				</Text>
			</View>
		);
	}

	if (certificates.length === 0) {
		return (
			<View className="flex-1 items-center justify-center py-20 px-4">
				<Award size={64} color={isDark ? "#6b7280" : "#9ca3af"} />
				<Text
					className={`mt-4 text-lg font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
				>
					No certificates yet
				</Text>
				<Text
					className={`mt-2 text-sm text-center ${isDark ? "text-gray-500" : "text-gray-500"}`}
				>
					Complete tests with passing scores to earn certificates
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1" contentContainerClassName="p-4">
			<View
				className="flex-row flex-wrap"
				style={{
					gap:
						Platform.OS === "web"
							? isLargeScreen
								? 16
								: isMediumScreen
									? 12
									: 8
							: 12,
					justifyContent: Platform.OS === "web" ? "flex-start" : "center",
				}}
			>
				{certificates.map((certificate) => (
					<View
						key={certificate.id}
						className={`rounded-xl p-5 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
						style={{
							width:
								Platform.OS === "web"
									? isLargeScreen
										? "32%"
										: isMediumScreen
											? "48.5%"
											: "100%"
									: "100%",
							minHeight: 200,
						}}
					>
						<View className="flex-row items-start justify-between mb-3">
							<View className="flex-1">
								<View className="flex-row items-center mb-2">
									<Award size={24} color={isDark ? "#fbbf24" : "#f59e0b"} />
									<View
										className={`ml-2 px-2 py-1 rounded-full ${isDark ? "bg-green-900/30" : "bg-green-100"}`}
									>
										<View className="flex-row items-center">
											<CheckCircle2
												size={12}
												color={isDark ? "#86efac" : "#16a34a"}
											/>
											<Text
												className={`ml-1 text-xs font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}
											>
												Verified
											</Text>
										</View>
									</View>
								</View>
								<Text
									className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
									numberOfLines={2}
								>
									{certificate.test_title || "Test Certificate"}
								</Text>
								{certificate.percentage !== undefined && (
									<View className="flex-row items-center mt-2">
										<Text
											className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}
										>
											{certificate.percentage}%
										</Text>
										<Text
											className={`ml-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
										>
											({certificate.score}/{certificate.total_points} points)
										</Text>
									</View>
								)}
							</View>
						</View>

						<View className="flex-row items-center gap-3 mb-4">
							<View className="flex-row items-center">
								<Calendar size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
								<Text
									className={`ml-1 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
								>
									{new Date(certificate.issued_at).toLocaleDateString()}
								</Text>
							</View>
						</View>

						<View className="flex-row gap-2 mt-auto">
							<Button
								onPress={() => handleView(certificate)}
								variant="default"
								className="flex-1 py-2.5 min-h-[44px]"
							>
								<Text className="text-white font-semibold text-sm">View</Text>
							</Button>
							<Button
								onPress={() => handleDownload(certificate)}
								variant="secondary"
								className="py-2.5 px-3 min-h-[44px]"
							>
								<Download size={16} color={isDark ? "#d1d5db" : "#374151"} />
							</Button>
							<Button
								onPress={() => handleShare(certificate)}
								variant="secondary"
								className="py-2.5 px-3 min-h-[44px]"
							>
								<Share2 size={16} color={isDark ? "#d1d5db" : "#374151"} />
							</Button>
						</View>
					</View>
				))}
			</View>
		</ScrollView>
	);
}
