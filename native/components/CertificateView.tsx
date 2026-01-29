import {
	Award,
	Calendar,
	CheckCircle2,
	Copy,
	Download,
	Share2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Platform,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { Text } from "@/components/ui/text";
import { API_URL, certificateAPI } from "@/lib/api";
import type { Certificate } from "@/lib/types";

interface CertificateViewProps {
	certificateId: number;
}

export function CertificateView({ certificateId }: CertificateViewProps) {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const [certificate, setCertificate] = useState<Certificate | null>(null);
	const [loading, setLoading] = useState(true);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const { showAlert } = useCustomAlert();

	useEffect(() => {
		loadCertificate();

		// normalize pdfUrl when certificate loads
		return () => {};
	}, [certificateId]);

	// Ensure pdfUrl is absolute and points to a .pdf when possible
	useEffect(() => {
		const normalize = async () => {
			if (!certificate) return;
			let url = certificate.pdf_url || null;
			if (!url) return;
			// If relative, prefix API_URL if available
			if (!/^https?:\/\//i.test(url)) {
				const base =
					API_URL ||
					(typeof window !== "undefined" ? window.location.origin : "");
				if (base)
					url = url.startsWith("/")
						? `${base.replace(/\/$/, "")}${url}`
						: `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
			}
			// If url does not end with .pdf, try to call download endpoint to get actual pdf url
			if (!url.toLowerCase().endsWith(".pdf")) {
				try {
					const resp = await certificateAPI.download(certificate.id);
					if (resp.data?.pdf_url) {
						url = resp.data.pdf_url;
					}
				} catch (e) {
					// ignore
				}
			}
			setPdfUrl(url);
		};

		normalize();
	}, [certificate]);

	const loadCertificate = async () => {
		try {
			setLoading(true);
			const response = await certificateAPI.getById(certificateId);
			setCertificate(response.data.certificate);

			// Use pdf_url from certificate record if present
			setPdfUrl(response.data.certificate.pdf_url || null);
		} catch (error: any) {
			console.error("Failed to load certificate:", error);
			showAlert("Error", "Failed to load certificate");
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async () => {
		if (!certificate) return;

		try {
			const response = await certificateAPI.download(certificate.id);
			if (response.data.pdf_url) {
				let url = response.data.pdf_url;
				if (!/^https?:\/\//i.test(url)) {
					const base =
						API_URL ||
						(typeof window !== "undefined" ? window.location.origin : "");
					if (base)
						url = url.startsWith("/")
							? `${base.replace(/\/$/, "")}${url}`
							: `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
				}
				// On web, embed PDF in-app
				if (Platform.OS === "web") {
					setPdfUrl(url);
				} else {
					const canOpen = await Linking.canOpenURL(url);
					if (canOpen) {
						await Linking.openURL(url);
					} else {
						showAlert("Error", "Cannot open PDF URL");
					}
				}
			} else {
				showAlert("Info", "PDF generation will be available soon");
			}
		} catch (error: any) {
			console.error("Failed to download certificate:", error);
			showAlert("Error", "Failed to download certificate");
		}
	};

	const handleEmail = async () => {
		if (!certificate) return;

		try {
			let to: string | undefined;
			if (Platform.OS === "web") {
				to =
					window.prompt(
						"Enter recipient email (leave empty to send to student):",
						certificate.student_email || "",
					) || undefined;
			}

			const payload = to ? { to } : undefined;
			await certificateAPI.email(certificate.id, payload as any);
			showAlert("Success", "Certificate emailed successfully");
		} catch (error: any) {
			console.error("Failed to email certificate:", error);
			showAlert(
				"Error",
				error?.response?.data?.error || "Failed to email certificate",
			);
		}
	};

	const handleShare = async () => {
		if (!certificate) return;

		try {
			const apiBase = (
				API_URL ||
				(typeof window !== "undefined" ? window.location.origin + "/api" : "")
			).replace(/\/api\/?$/, "");
			const verificationUrl =
				certificate.verification_url ||
				`${apiBase}/verify-certificate?code=${certificate.certificate_code}`;

			if (Platform.OS === "web") {
				await navigator.clipboard.writeText(verificationUrl);
				showAlert("Success", "Verification link copied to clipboard");
			} else {
				showAlert("Info", `Verification Code: ${certificate.certificate_code}`);
			}
		} catch (error) {
			showAlert("Error", "Failed to share certificate");
		}
	};

	const handleCopyCode = async () => {
		if (!certificate) return;

		try {
			if (Platform.OS === "web") {
				await navigator.clipboard.writeText(certificate.certificate_code);
				showAlert("Success", "Certificate code copied to clipboard");
			} else {
				showAlert("Info", `Certificate Code: ${certificate.certificate_code}`);
			}
		} catch (error) {
			showAlert("Error", "Failed to copy certificate code");
		}
	};

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center py-20">
				<ActivityIndicator size="large" color="#3b82f6" />
				<Text
					className={`mt-4 text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
				>
					Loading certificate...
				</Text>
			</View>
		);
	}

	if (!certificate) {
		return (
			<View className="flex-1 items-center justify-center py-20 px-4">
				<Text
					className={`text-lg font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
				>
					Certificate not found
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1" contentContainerClassName="p-6">
			{/* Certificate Display */}
			<View
				className={`rounded-2xl p-8 mb-6 ${isDark ? "bg-gray-800 border-2 border-yellow-500" : "bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-400"}`}
			>
				<View className="items-center mb-6">
					<Award size={80} color={isDark ? "#fbbf24" : "#f59e0b"} />
				</View>

				{/* Embedded PDF viewer for web (show only PDF when available) */}
				{Platform.OS === "web" && pdfUrl ? (
					<View className="mb-6 w-full" style={{ height: 720 }}>
						{/* Attempt to hide browser PDF toolbar where supported via fragment params */}
						<iframe
							title="Certificate PDF"
							src={
								pdfUrl +
								(pdfUrl.includes("#")
									? "&toolbar=0&navpanes=0&scrollbar=0"
									: "#toolbar=0&navpanes=0&scrollbar=0")
							}
							style={{
								width: "100%",
								height: "100%",
								border: "none",
								borderRadius: 12,
								backgroundColor: isDark ? "#0f172a" : "#ffffff",
							}}
							frameBorder={0}
							allowFullScreen
						/>
					</View>
				) : (
					// Show styled HTML certificate preview when no PDF is embedded
					<View
							className={`rounded-2xl p-6 mb-6 ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}
							style={{ fontFamily: "Inter, Arial, sans-serif" }}
						>
							<View
								className={`rounded-lg p-4 mb-4 ${isDark ? "bg-gradient-to-r from-yellow-700 to-yellow-500" : "bg-gradient-to-r from-yellow-200 to-yellow-50"}`}
							>
								<View className="items-center">
									<Award size={72} color={isDark ? "#fff" : "#b45309"} />
								</View>
								<Text
									className={`text-center font-extrabold ${isDark ? "text-white" : "text-amber-800"}`}
									style={{ fontSize: 22, letterSpacing: 1.2 }}
								>
									Certificate of Achievement
								</Text>
							</View>

							<View className="items-center mb-4">
								<Text
									className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
								>
									This certifies that
								</Text>
								<Text
									className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
									style={{ fontSize: 30, marginTop: 8 }}
								>
									{certificate.student_name || "Student"}
								</Text>
								<Text
									className={`text-base mt-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
								>
									has successfully completed
								</Text>
								<Text
									className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
									style={{ fontSize: 20, marginTop: 6 }}
								>
									{certificate.test_title || "Test"}
								</Text>
							</View>

							<View className="flex-row items-center justify-center gap-4 mb-6">
								{certificate.percentage !== undefined && (
									<View
										className={`px-6 py-3 rounded-full ${isDark ? "bg-green-800/20" : "bg-green-50"}`}
									>
										<Text
											className={`text-2xl font-bold ${isDark ? "text-green-300" : "text-green-700"}`}
										>
											{certificate.percentage}%
										</Text>
									</View>
								)}
								<View>
									<Text
										className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Score
									</Text>
									<Text
										className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
									>
										{certificate.score}/{certificate.total_points}
									</Text>
								</View>
							</View>

							<View className="mt-4 pt-4 border-t border-gray-200 flex-row justify-between items-center">
								<View>
									<Text
										className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Issued
									</Text>
									<Text
										className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
									>
										{new Date(certificate.issued_at).toLocaleDateString()}
									</Text>
								</View>

								<View className="items-center">
									<Text
										className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Verified
									</Text>
									<View className="flex-row items-center">
										<CheckCircle2
											size={18}
											color={isDark ? "#86efac" : "#16a34a"}
										/>
										<Text
											className={`ml-2 text-sm font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}
										>
											Verified Certificate
										</Text>
									</View>
								</View>
							</View>

							<View className="mt-6 flex-row justify-between items-end">
								<View>
									<Text
										className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Issuer
									</Text>
									<Text
										className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
									>
										Quiz Portal
									</Text>
								</View>

								<View style={{ alignItems: "center" }}>
									<View
										style={{
											borderTopWidth: 1,
											width: 180,
											borderColor: isDark ? "#374151" : "#d1d5db",
										}}
									/>
									<Text
										className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
									>
										Signature
									</Text>
								</View>
							</View>
						</View>
				)}

				<Text
					className={`text-center text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
				>
					Certificate of Achievement
				</Text>

				<Text
					className={`text-center text-lg mb-6 ${isDark ? "text-gray-300" : "text-gray-700"}`}
				>
					This certifies that
				</Text>

				<Text
					className={`text-center text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
				>
					{certificate.student_name || "Student"}
				</Text>

				<Text
					className={`text-center text-base mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
				>
					has successfully completed
				</Text>

				<Text
					className={`text-center text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
				>
					{certificate.test_title || "Test"}
				</Text>

				{certificate.percentage !== undefined && (
					<View className="items-center mb-6">
						<View
							className={`px-6 py-3 rounded-full ${isDark ? "bg-green-900/30" : "bg-green-100"}`}
						>
							<Text
								className={`text-3xl font-bold ${isDark ? "text-green-400" : "text-green-700"}`}
							>
								{certificate.percentage}%
							</Text>
						</View>
						<Text
							className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							Score: {certificate.score}/{certificate.total_points} points
						</Text>
					</View>
				)}

				<View className="items-center mt-6 pt-6 border-t border-gray-300">
					<View className="flex-row items-center mb-2">
						<Calendar size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
						<Text
							className={`ml-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							Issued on {new Date(certificate.issued_at).toLocaleDateString()}
						</Text>
					</View>
					<View className="flex-row items-center">
						<CheckCircle2 size={16} color={isDark ? "#86efac" : "#16a34a"} />
						<Text
							className={`ml-2 text-sm font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}
						>
							Verified Certificate
						</Text>
					</View>
				</View>
			</View>

			{/* Certificate Details */}
			<View
				className={`rounded-xl p-5 mb-6 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
			>
				<Text
					className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
				>
					Certificate Details
				</Text>

				<View className="gap-3">
					<View className="flex-row justify-between">
						<Text
							className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
						>
							Certificate Code:
						</Text>
						<View className="flex-row items-center">
							<Text
								className={`text-sm font-mono font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
							>
								{certificate.certificate_code}
							</Text>
							<Button
								onPress={handleCopyCode}
								variant="ghost"
								className="ml-2 p-1"
							>
								<Copy size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
							</Button>
						</View>
					</View>

					{certificate.verification_url && (
						<View className="flex-row justify-between">
							<Text
								className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
							>
								Verification URL:
							</Text>
							<Text
								className={`text-sm font-mono ${isDark ? "text-blue-400" : "text-blue-600"}`}
								numberOfLines={1}
							>
								{certificate.verification_url.substring(0, 30)}...
							</Text>
						</View>
					)}

					{certificate.verified_at && (
						<View className="flex-row justify-between">
							<Text
								className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
							>
								Verified At:
							</Text>
							<Text
								className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
							>
								{new Date(certificate.verified_at).toLocaleString()}
							</Text>
						</View>
					)}
				</View>
			</View>

			{/* Action Buttons */}
			<View className="flex-row gap-3">
				{Platform.OS === "web" ? (
					// On web show a direct download anchor if pdfUrl available
					pdfUrl ? (
						<a href={pdfUrl} download style={{ flex: 1 }}>
							<Button variant="default" className="w-full py-3">
								<View className="flex-row items-center justify-center gap-2">
									<Download size={20} color="white" />
									<Text className="text-white font-semibold">Download PDF</Text>
								</View>
							</Button>
						</a>
					) : (
						<Button
							onPress={handleDownload}
							variant="default"
							className="flex-1 py-3"
						>
							<View className="flex-row items-center justify-center gap-2">
								<Download size={20} color="white" />
								<Text className="text-white font-semibold">Generate PDF</Text>
							</View>
						</Button>
					)
				) : (
					<Button
						onPress={handleDownload}
						variant="default"
						className="flex-1 py-3"
					>
						<View className="flex-row items-center justify-center gap-2">
							<Download size={20} color="white" />
							<Text className="text-white font-semibold">Download PDF</Text>
						</View>
					</Button>
				)}

				<Button onPress={handleEmail} variant="outline" className="flex-1 py-3">
					<View className="flex-row items-center justify-center gap-2">
						<Share2 size={20} color={isDark ? "#d1d5db" : "#374151"} />
						<Text
							className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
						>
							Email
						</Text>
					</View>
				</Button>

				<Button onPress={handleShare} variant="outline" className="flex-1 py-3">
					<View className="flex-row items-center justify-center gap-2">
						<Share2 size={20} color={isDark ? "#d1d5db" : "#374151"} />
						<Text
							className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
						>
							Share
						</Text>
					</View>
				</Button>
			</View>
		</ScrollView>
	);
}
