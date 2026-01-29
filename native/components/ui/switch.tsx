import { Pressable, View } from "react-native";
import { Text } from "./text";

interface ToggleSwitchProps {
    label: string;
    description: string;
    value: boolean;
    onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    label,
    description,
    value,
    onToggle
}) => (
    <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between py-3 px-4 bg-background rounded-xl border border-border"
    >
        <View className="flex-1 mr-3">
            <Text className="font-semibold text-foreground">{label}</Text>
            <Text className="text-sm text-muted-foreground">{description}</Text>
        </View>
        <View className={`w-12 h-6 rounded-full p-1 ${value ? 'bg-primary' : 'bg-border'}`}>
            <View className={`w-4 h-4 rounded-full bg-white transition-all ${value ? 'ml-auto' : ''}`} />
        </View>
    </Pressable>
);
export default ToggleSwitch;