import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, frame, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * iOS home screen widget (WidgetKit via expo-widgets). Small: the pet alone,
 * showing its mood. Medium: the pet, a line that says what to do next, and
 * three buttons that deep-link straight to water, movement and eating.
 * Only SwiftUI components from @expo/ui are allowed here, nothing from
 * module scope.
 */
export type MochiWidgetProps = {
  petName: string;
  stageName: string;
  completed: number;
  level: number;
  petImage: string;
  isEgg: boolean;
  statusLine: string;
  waterDone: boolean;
  movementDone: boolean;
  eatingDone: boolean;
};

const MochiWidget = (props: MochiWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const ink = '#20231F';
  const muted = '#767B72';
  const sage = '#5F7A62';
  const sageSoft = '#DCE5D9';
  const surface = '#FFFEFA';
  if (environment.widgetFamily === 'systemSmall') {
    return (
      <VStack modifiers={[widgetURL('mochi://today')]}>
        <Image uiImage={props.petImage} modifiers={[frame({ width: 120, height: 120 })]} />
      </VStack>
    );
  }
  const goal = (label: string, symbol: 'drop.fill' | 'figure.walk' | 'fork.knife', done: boolean, destination: string) => (
    <Link destination={destination}>
      <HStack
        spacing={8}
        modifiers={[
          padding({ horizontal: 10, vertical: 6 }),
          frame({ maxWidth: 10000, alignment: 'leading' }),
          background(done ? sageSoft : surface),
          cornerRadius(12),
        ]}
      >
        <Image systemName={symbol} size={14} color={done ? sage : ink} />
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle(done ? sage : ink)]}>{label}</Text>
        <Spacer />
        <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle(done ? sage : muted)]}>{done ? 'Done' : 'Log'}</Text>
      </HStack>
    </Link>
  );
  return (
    <HStack spacing={12}>
      <Link destination="mochi://today">
        <Image uiImage={props.petImage} modifiers={[frame({ width: 110, height: 110 })]} />
      </Link>
      <VStack alignment="leading" spacing={6}>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>{props.statusLine}</Text>
        {goal('Water', 'drop.fill', props.waterDone, 'mochi://today/water')}
        {goal('Move', 'figure.walk', props.movementDone, 'mochi://today/goal/movement')}
        {goal('Eat', 'fork.knife', props.eatingDone, 'mochi://today/goal/eating')}
      </VStack>
    </HStack>
  );
};

export default createWidget<MochiWidgetProps>('MochiWidget', MochiWidget);
