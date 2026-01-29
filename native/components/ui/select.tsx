import { Pressable, View } from "react-native";
import { Text } from "./text";
import { LucideIcon } from "lucide-react-native";



interface SelectOptionProps {
    value: string;
    label: string;
    description: string;
    icon?: LucideIcon;
    selected: boolean;
    onPress: () => void;
}

const SelectOption: React.FC<SelectOptionProps> = ({
    value,
    label,
    description,
    icon: Icon,
    selected,
    onPress
}) => (
    <Pressable
        key={value}
        onPress={onPress}
        className={`p-4 rounded-xl border flex-row items-center ${selected
            ? 'bg-primary border-primary'
            : 'bg-background border-border'
            }`}
    >
        {Icon && (
            <Icon
                size={24}
                color={selected ? '#ffffff' : '#666666'}
            />
        )}
        <View className={`flex-1 ${Icon ? 'ml-3' : ''}`}>
            <Text className={`font-semibold ${selected ? 'text-white' : 'text-foreground'}`}>
                {label}
            </Text>
            <Text className={`text-sm ${selected ? 'text-white/80' : 'text-muted-foreground'}`}>
                {description}
            </Text>
        </View>
    </Pressable>
);

export default SelectOption;