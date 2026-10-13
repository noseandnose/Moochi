import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * iOS home screen widget (WidgetKit via expo-widgets). Shows the pet, today's
 * daily goal count and growth. Only SwiftUI components from @expo/ui are
 * allowed here, and nothing from module scope.
 */
export type MochiWidgetProps = {
  petName: string;
  stageName: string;
  completed: number;
  bonus: number;
  level: number;
  xpToNext: number;
  nextStageName: string;
  petImage: string;
  isEgg: boolean;
};

const MochiWidget = (props: MochiWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const ink = '#20231F';
  const muted = '#767B72';
  const sage = '#5F7A62';
  const small = environment.widgetFamily === 'systemSmall';
  const summary = props.isEgg ? 'Complete goals to hatch' : `${props.xpToNext} XP to ${props.nextStageName}`;
  if (small) {
    return (
      <VStack alignment="leading" spacing={4}>
        <HStack spacing={6}>
          <Image uiImage={props.petImage} modifiers={[frame({ width: 48, height: 48 })]} />
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ weight: 'bold', size: 15 }), foregroundStyle(ink)]}>{props.petName}</Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
              {props.stageName} · Lv {props.level}
            </Text>
          </VStack>
        </HStack>
        <Spacer />
        <Text modifiers={[font({ weight: 'bold', size: 22 }), foregroundStyle(props.completed === 3 ? sage : ink)]}>{props.completed}/3 today</Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{summary}</Text>
      </VStack>
    );
  }
  return (
    <HStack spacing={14}>
      <Image uiImage={props.petImage} modifiers={[frame({ width: 96, height: 96 })]} />
      <VStack alignment="leading" spacing={4}>
        <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(ink)]}>{props.petName}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          {props.stageName} · Level {props.level}
        </Text>
        <Spacer />
        <Text modifiers={[font({ weight: 'bold', size: 24 }), foregroundStyle(props.completed === 3 ? sage : ink)]}>{props.completed}/3 daily goals</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          {props.bonus}/3 bonus · {summary}
        </Text>
      </VStack>
      <Spacer />
    </HStack>
  );
};

export default createWidget<MochiWidgetProps>('MochiWidget', MochiWidget);
