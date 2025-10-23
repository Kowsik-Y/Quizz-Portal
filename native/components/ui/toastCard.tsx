import { BadgeInfo, Bug, CircleCheck, Info } from "lucide-react-native"
import { View, TouchableOpacity } from "react-native"
import { Text } from "./text";

const variant = {
    success: {
        icon: CircleCheck,
        background: 'bg-green-100/50 dark:bg-green-900/50 border-green-300/60 dark:border-green-800 shadow-green-500/20',
        text: 'text-green-500',
    },
    error: {
        icon: Bug,
        background: 'bg-red-100/50 dark:bg-red-900/50 border-red-300/60 dark:border-red-800 shadow-red-500/20',
        text: 'text-red-500',
    },
    info: {
        icon: Info,
        background: 'bg-blue-100/50 dark:bg-blue-900/50 border-blue-300/60 dark:border-blue-800 shadow-blue-500/20',
        text: 'text-blue-500',
    },
    warning: {
        icon: BadgeInfo,
        background: 'bg-yellow-100/50 dark:bg-yellow-800/50 border-yellow-300/60 dark:border-yellow-800 shadow-yellow-500/20',
        text: 'text-yellow-500',
    }
};
const ToastCard = ({ text1, text2, type, props }: { text1: string, text2: string, type: 'success' | 'error' | 'info' | 'warning', props?: any }) => {
    const variantStyle = variant[type];
    return (
        <View pointerEvents="none" className="right-0 sm:right-3" style={{ position: 'absolute', top: 10, alignItems: 'flex-end', width: '100%', zIndex: 9999 }}>
            <View className={`w-full max-w-full sm:max-w-md rounded-sm bg-background`}>
                <View className={`${variantStyle.background} flex-row items-center gap-4 flex-1 px-4 py-3 justify-between border-[1px] rounded-sm  shadow-sm`}>
                    <View className="flex-row items-center gap-4">
                        <variantStyle.icon size={35} className={`${variantStyle.text}`} />
                        <View className="flex-1">
                            {text1 && <Text className={`${variantStyle.text} font-bold text-base tracking-wider`}>{text1}</Text>}
                            {text2 && <Text className={`${variantStyle.text} text-sm font-medium`}>{text2}</Text>}
                        </View>
                    </View>
                    {props?.action && (
                        <TouchableOpacity
                            onPress={props.action.onPress}
                            className={`ml-3 ${variantStyle.background} px-3 py-1 rounded`}
                        >
                            <Text className={`${variantStyle.text} font-semibold`}>{props.action.text}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

        </View>
    )
}
export default ToastCard;