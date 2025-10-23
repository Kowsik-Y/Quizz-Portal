
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from './text';


const HeaderTile = ({ title, foot }:{title:string, foot:string}) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const canGoBack = router.canGoBack?.() ?? false;

    return (
        <View className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
            <View className="flex-row items-center">
                {canGoBack &&
                    <Pressable
                        onPress={() => router.back()}
                        className={`mr-3 p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                        <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
                    </Pressable>
                }
                <View>
                    <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                       {title}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        {foot}
                    </Text>
                </View>
            </View>
        </View>
    );
}
export default HeaderTile;