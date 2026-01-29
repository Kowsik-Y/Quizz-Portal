import * as WebBrowser from "expo-web-browser";

// WebView is loaded dynamically at runtime to avoid build errors when not installed
let NativeWebView: any = null;
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	NativeWebView = require("react-native-webview").WebView;
} catch {
	NativeWebView = null;
}

import {
	Download,
	ExternalLink,
	FileCode,
	FileText,
	PlayCircle,
	Video,
	X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { materialProgressAPI } from "@/lib/api";
import type { CourseMaterial } from "@/lib/types";

interface MaterialViewerProps {
	visible: boolean;
	material: CourseMaterial | null;
	materialType: "test" | "course";
	onClose: () => void;
	onMarkViewed?: () => void;
}

export function MaterialViewer({
	visible,
	material,
	materialType,
	onClose,
	onMarkViewed,
}: MaterialViewerProps) {
	/* ----------------------------- hooks (ALWAYS) ----------------------------- */
	const { colorScheme } = useColorScheme();
	const isDark = colorScheme === "dark";

	const [loading, setLoading] = useState(false);
	const [viewed, setViewed] = useState(false);
	const [showEmbedded, setShowEmbedded] = useState(false);

	/* ----------------------------- derived values ----------------------------- */
	const materialId = material?.id ?? null;
	const materialTypeLower = (
		material?.material_type || "document"
	).toLowerCase();

	const isPDF = materialTypeLower === "pdf";

	const isVideo =
		materialTypeLower === "video" ||
		materialTypeLower.includes("mp4") ||
		materialTypeLower.includes("avi");

	const isCode =
		materialTypeLower === "code" || materialTypeLower === "programming";

	const isLink = materialTypeLower === "link";

	const isYouTube = Boolean(
		material?.file_url &&
			/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/)/i.test(
				material.file_url,
			),
	);

	const effectiveIsVideo = isVideo || isYouTube;

	/* ----------------------------- side effects ----------------------------- */
	const markAsViewed = useCallback(async () => {
		if (!materialId || viewed) return;

		try {
			await materialProgressAPI.markViewed({
				material_id: materialId,
				material_type: materialType,
			});
			setViewed(true);
			onMarkViewed?.();
		} catch (error) {
			console.error("Failed to mark material as viewed:", error);
		}
	}, [materialId, materialType, viewed, onMarkViewed]);

	useEffect(() => {
		if (visible && materialId && !viewed) {
			markAsViewed();
		}
	}, [visible, materialId, viewed, markAsViewed]);

	useEffect(() => {
		if (!visible) return;
		setShowEmbedded(effectiveIsVideo);
	}, [visible, effectiveIsVideo]);

	/* ----------------------------- helpers ----------------------------- */
	const getYouTubeEmbed = (url: string) => {
		const short = url.match(/youtu\.be\/([\w-]+)/i);
		if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

		const watch = url.match(/[?&]v=([\w-]+)/i);
		if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

		const shorts = url.match(/youtube\.com\/shorts\/([\w-]+)/i);
		if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;

		return url;
	};

	const handleOpenPDF = async () => {
		if (!material?.file_url) return;

		if (Platform.OS === "web" || NativeWebView) {
			setShowEmbedded(true);
			return;
		}

		setLoading(true);
		try {
			const supported = await WebBrowser.isAvailableAsync();
			if (supported) {
				await WebBrowser.openBrowserAsync(material.file_url, {
					presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
					toolbarColor: isDark ? "#1f2937" : "#ffffff",
				});
			} else if (await Linking.canOpenURL(material.file_url)) {
				await Linking.openURL(material.file_url);
			}
		} catch (error) {
			console.error("Error opening PDF:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenLink = async () => {
		if (!material?.file_url) return;

		setLoading(true);
		try {
			if (isYouTube) {
				setShowEmbedded(true);
			} else if (await Linking.canOpenURL(material.file_url)) {
				await Linking.openURL(material.file_url);
			}
		} catch (error) {
			console.error("Error opening link:", error);
		} finally {
			setLoading(false);
		}
	};

	/* ----------------------------- safe early return ----------------------------- */
	if (!material) return null;

	/* --------------------------------- UI ---------------------------------- */
	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="fullScreen"
			onRequestClose={onClose}
		>
			<View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
				{/* Header */}
				<View
					className={`px-6 py-4 flex-row items-start justify-between border-b ${
						isDark ? "border-gray-800" : "border-gray-200"
					}`}
				>
					<View className="flex-1 pr-4">
						<Text
							className={`text-lg font-semibold ${
								isDark ? "text-white" : "text-gray-900"
							}`}
							numberOfLines={2}
						>
							{material.title}
						</Text>
						{material.description && (
							<Text
								className={`text-sm mt-1 ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								{material.description}
							</Text>
						)}
					</View>

					<Pressable onPress={onClose} className="p-2 rounded-full">
						<X size={22} color={isDark ? "#fff" : "#111827"} />
					</Pressable>
				</View>

				{/* Body */}
				<ScrollView className="flex-1">
					<View className="px-6 py-6 md:flex-row md:gap-6">
						{/* LEFT PANEL */}
						<View className="md:w-2/5 mb-8 md:mb-0">
							{/* Type badge */}
							<View
								className={`self-start px-3 py-1 rounded-full mb-4 ${
									isDark ? "bg-gray-800" : "bg-gray-200"
								}`}
							>
								<Text
									className={`text-xs font-medium uppercase tracking-wide ${
										isDark ? "text-gray-300" : "text-gray-700"
									}`}
								>
									{materialTypeLower}
								</Text>
							</View>

							{/* Icon */}
							<View className="mb-6">
								{isPDF && <FileText size={56} color="#dc2626" />}
								{effectiveIsVideo && <Video size={56} color="#2563eb" />}
								{isCode && <FileCode size={56} color="#7c3aed" />}
								{!isPDF && !effectiveIsVideo && !isCode && (
									<FileText size={56} color="#9ca3af" />
								)}
							</View>

							{/* Actions */}
							<View className="gap-3">
								{isPDF && (
									<Button onPress={handleOpenPDF} className="w-full">
										<FileText size={18} color="white" />
										<Text className="text-white ml-2">Preview PDF</Text>
									</Button>
								)}

								{effectiveIsVideo && (
									<Button
										onPress={() => setShowEmbedded(true)}
										className="w-full"
									>
										<PlayCircle size={18} color="white" />
										<Text className="text-white ml-2">Watch Video</Text>
									</Button>
								)}

								{isLink && (
									<Button onPress={handleOpenLink} className="w-full">
										<ExternalLink size={18} color="white" />
										<Text className="text-white ml-2">Open Link</Text>
									</Button>
								)}

								{material.file_url && (
									<Button
										variant="outline"
										className="w-full"
										onPress={() => Linking.openURL(material.file_url!)}
									>
										<Download size={18} />
										<Text className="ml-2">Download</Text>
									</Button>
								)}
							</View>

							{viewed && (
								<View className="mt-6 px-4 py-3 rounded-lg bg-green-50">
									<Text className="text-green-700 text-sm text-center font-medium">
										✓ Marked as viewed
									</Text>
								</View>
							)}
						</View>

						{/* RIGHT PANEL — PREVIEW */}
						<View className="md:w-3/5">
							<View
								className={`w-full rounded-xl overflow-hidden border ${
									isDark
										? "border-gray-800 bg-gray-950"
										: "border-gray-200 bg-white"
								} h-64 md:h-[70vh]`}
							>
								{showEmbedded && material.file_url ? (
									Platform.OS === "web" ? (
										<iframe
											src={
												isYouTube
													? getYouTubeEmbed(material.file_url)
													: material.file_url
											}
											style={{
												width: "100%",
												height: "100%",
												border: "none",
											}}
											allowFullScreen
										/>
									) : NativeWebView ? (
										<NativeWebView
											source={{
												uri: isYouTube
													? getYouTubeEmbed(material.file_url)
													: material.file_url,
											}}
											style={{ flex: 1 }}
										/>
									) : (
										<View className="flex-1 items-center justify-center">
											<Text className="text-gray-400">
												Preview not available
											</Text>
										</View>
									)
								) : (
									<View className="flex-1 items-center justify-center">
										<Text className="text-gray-400">
											Select an action to preview
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>
				</ScrollView>
			</View>
		</Modal>
	);
}
