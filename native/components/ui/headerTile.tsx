
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from './text';


const HeaderTile = ({ title, foot }:{title:string, foot:string}) => {
    const router = useRouter();
    const canGoBack = router.canGoBack?.() ?? false;

    return (
        <View className="bg-background border-border border-b px-6 py-4">
            <View className="flex-row items-center">
                {canGoBack &&
                    <Pressable
                        onPress={() => router.back()}
                        className="mr-3 p-2 rounded-lg bg-muted"
                    >
                        <ChevronLeft size={24} color="#3b82f6" />
                    </Pressable>
                }
                <View>
                    <Text className="text-2xl font-bold text-foreground">
                       {title}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                        {foot}
                    </Text>
                </View>
            </View>
        </View>
    );
}
export default HeaderTile;