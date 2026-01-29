import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function PublicLayout() {
	const router = useRouter();
	const { colorScheme } = useColorScheme();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const initializing = useAuthStore((state) => state.initializing);

	// Get background color based on theme
	const backgroundColor = colorScheme === "dark" ? "#1a1f2e" : "#f9fafb";

	useEffect(() => {
		if (!initializing && isAuthenticated) {
			router.replace("/(protected)/(tabs)/home");
		}
	}, [isAuthenticated, initializing, router]);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "default",
				contentStyle: {
					backgroundColor: backgroundColor,
				},
			}}
		>
			<Stack.Screen name="index" options={{ title: "Welcome" }} />
			<Stack.Screen name="login" options={{ title: "Login" }} />
			<Stack.Screen name="register" options={{ title: "Register" }} />
			<Stack.Screen
				name="verify-certificate"
				options={{ title: "Verify Certificate" }}
			/>
		</Stack>
	);
}
