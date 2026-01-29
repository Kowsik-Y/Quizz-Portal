import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, ScrollView } from "react-native";
import { CertificateView } from "@/components/CertificateView";
import { Button } from "@/components/ui/button";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { Text } from "@/components/ui/text";
import { attemptAPI, certificateAPI, testAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function CertificatePage() {
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";
	const router = useRouter();
	const { testId } = useLocalSearchParams();
	const user = useAuthStore((s) => s.user);
	const { showAlert } = useCustomAlert();

	const [loading, setLoading] = useState(true);
	const [test, setTest] = useState<any | null>(null);
	const [hasCertificate, setHasCertificate] = useState(false);
	const [certificate, setCertificate] = useState<any | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			if (!testId) return;
			setLoading(true);
			try {
				const resp = await testAPI.getById(Number(testId));
				setTest(resp.data.test);

				// Check student attempts for a passing score
				if (user?.id) {
					try {
						const attemptsResp = await attemptAPI.getStudentAttempts(
							user.id,
							Number(testId),
						);
						const attempts = attemptsResp.data.attempts || [];
						const passed = attempts.some((a: any) => {
							if (a.status !== "submitted") return false;
							const percentage = Math.round((a.score / a.total_points) * 100);
							return percentage >= (resp.data.test?.passing_score || 60);
						});
						setHasCertificate(passed);

						// If passed, try to find an existing certificate for this test
						if (passed) {
							try {
								const certsResp = await certificateAPI.getMyCertificates();
								const certs = certsResp.data.certificates || [];
								const found = certs.find(
									(c: any) => c.test_id === Number(testId),
								);
								if (found) setCertificate(found);
							} catch (e) {
								console.error("Failed to load certificates", e);
							}
						}
					} catch (e) {
						console.error("Failed to load attempts", e);
					}
				}
			} catch (e) {
				setError("Failed to load certificate data");
			}
			setLoading(false);
		};

		load();
	}, [testId, user?.id]);

	// CertificateView handles download/email UI

	const handleGenerate = async () => {
		// Find a passed attempt and call generate
		try {
			setLoading(true);
			if (!user?.id) throw new Error("User not available");

			const attemptsResp = await attemptAPI.getStudentAttempts(
				user.id,
				Number(testId),
			);
			const attempts = attemptsResp.data.attempts || [];
			const passedAttempt = attempts.find((a: any) => {
				if (a.status !== "submitted") return false;
				const percentage = Math.round((a.score / a.total_points) * 100);
				return percentage >= (test?.passing_score || 60);
			});

			if (!passedAttempt) {
				showAlert("Error", "No passed attempt found to generate certificate");
				return;
			}

			const genResp = await certificateAPI.generate({
				attempt_id: passedAttempt.id,
				test_id: Number(testId),
				certificate_type: "pdf",
			});

			const newCert = genResp.data.certificate;
			if (newCert) {
				setCertificate(newCert);
				setHasCertificate(true);
				showAlert("Success", "Certificate generated successfully");
			}
		} catch (error: any) {
			console.error("Generate certificate error", error);
			showAlert(
				"Error",
				error.response?.data?.error || "Failed to generate certificate",
			);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			>
				<ActivityIndicator size="large" color="#3b82f6" />
				<Text className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
					Loading certificate preview...
				</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View
				className={`flex-1 items-center justify-center p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			>
				<Text
					className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
				>
					Oops!
				</Text>
				<Text className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
					{error}
				</Text>
			</View>
		);
	}

	return (
		<View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
			<ScrollView
				contentContainerStyle={{ padding: 24, flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<Text
					className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
				>
					Certificate
				</Text>
				<Text className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
					This page shows the certificate for the test.
				</Text>

				{!hasCertificate ? (
					<View className="mt-8">
						<Text
							className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}
						>
							You do not currently have a certificate for this test.
						</Text>
						<Text
							className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
						>
							Complete and pass the test to unlock your iCertification.
						</Text>
					</View>
				) : !certificate ? (
					<View className="mt-8">
						<Text
							className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}
						>
							You passed the test. Generate your certificate now.
						</Text>
						<View className="mt-4">
							<Button onPress={handleGenerate} variant="default">
								<Text className="text-white font-semibold">
									Generate Certificate
								</Text>
							</Button>
						</View>
					</View>
				) : (
					<View className="mt-4">
						<CertificateView certificateId={certificate.id} />
					</View>
				)}
			</ScrollView>
		</View>
	);
}
