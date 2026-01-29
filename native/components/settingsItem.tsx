import { Pressable, View } from "react-native";
import { Text } from "./ui/text";

const SettingItem = ({ icon: Icon, title, description, value, onValueChange }: any) => (
    <View className="flex-row items-center justify-between py-4 px-4 bg-background rounded-xl border border-border">
        <View className="flex-1 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Icon size={20} className="text-primary" />
            </View>
            <View className="flex-1">
                <Text className="font-semibold text-foreground">{title}</Text>
                <Text className="text-xs text-muted-foreground mt-1">{description}</Text>
            </View>
        </View>
        <Pressable
            onPress={() => onValueChange(!value)}
        >
            <View className={`w-12 h-6 rounded-full p-1 ${value ? 'bg-primary' : 'bg-border'}`}>
                <View className={`w-4 h-4 rounded-full bg-white transition-all ${value ? 'ml-auto' : ''}`} />
            </View>
        </Pressable>
    </View>
);
export default SettingItem;