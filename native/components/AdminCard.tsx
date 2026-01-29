import { Pressable, View } from "react-native";
import { Text } from "./ui/text";
import { useColorScheme } from "nativewind";

const AdminCard = ({
    icon: Icon,
    title,
    description,
    onPress,
    color = '#3b82f6',
    bgColor = 'bg-blue-50',
    darkBgColor = 'bg-blue-900/20'
}: any) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Pressable
            onPress={onPress}
            className={`rounded-2xl p-5 mb-4 ${isDark ? `${darkBgColor} border border-gray-700` : `${bgColor} border border-gray-200`
                }`}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
            <View className="flex-row items-center">
                <View
                    className={`w-16 h-16 rounded-2xl items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'
                        }`}
                    style={{ shadowColor: color, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                >
                    <Icon size={28} color={color} />
                </View>
                <View className="ml-4 flex-1">
                    <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </Text>
                    <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {description}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
};
export default AdminCard;
