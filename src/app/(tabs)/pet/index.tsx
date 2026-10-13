import { useRouter } from 'expo-router';
import { ArrowLeftRight, Pencil, Share2, Sparkles } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CoinIcon } from '@/components/icons';
import { GearGrid, gearStatus } from '@/components/pet/GearGrid';
import { PetStage, type PetStageHandle } from '@/components/pet/PetStage';
import { DEFAULTS, GEAR_BY_ID, PATH_BY_ID, STAGES, getStage, getVisualPath, type GearId } from '@/game';
import { useAnimatedNumber } from '@/hooks/useCounter';
import { useHaptics } from '@/hooks/useHaptics';
import { useGame } from '@/state/GameProvider';
import { Button, Card, Field, Pill, Screen, SectionHeading, Text, useToast } from '@/ui/components';
import { colors, radius, spacing } from '@/ui/theme';

export default function MyPet() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const toast = useToast();
  const haptic = useHaptics();
  const stageRef = useRef<PetStageHandle>(null);
  const [preview, setPreview] = useState<GearId | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.profile.petName);
  const [nameError, setNameError] = useState<string | null>(null);

  const stage = getStage(state);
  const path = getVisualPath(state);
  const shownGear = preview ?? state.progress.equippedGear;
  const coins = useAnimatedNumber(state.progress.coins);
  const item = GEAR_BY_ID[shownGear];
  const status = gearStatus(shownGear, state.progress.ownedGear, state.progress.equippedGear, state.progress.coins, item.cost);
  const displayStage = stage === 'egg' ? 'baby' : stage;

  const act = () => {
    if (status.kind === 'equipped') return;
    const events = dispatch(status.kind === 'owned' ? { type: 'equipGear', gear: shownGear } : { type: 'buyGear', gear: shownGear });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') {
      toast(error.message, 'danger');
      haptic('warning');
      return;
    }
    const bought = events.some((e) => e.type === 'purchase');
    haptic(bought ? 'reward' : 'success');
    stageRef.current?.react();
    stageRef.current?.burst(0.8);
    toast(shownGear === 'none' ? 'Classic look equipped.' : bought ? `${item.name} unlocked and equipped.` : `${item.name} equipped.`);
    setPreview(null);
  };

  const saveName = () => {
    if (!nameDraft.trim()) {
      setNameError('Give your pet a name.');
      return;
    }
    const events = dispatch({ type: 'renamePet', name: nameDraft });
    const error = events.find((e) => e.type === 'error');
    if (error?.type === 'error') {
      setNameError(error.message);
      return;
    }
    setNameError(null);
    setRenaming(false);
    haptic('success');
    toast('Name saved.');
  };

  return (
    <Screen title="My pet" subtitle="Your pet. Your style." settings inTabs>
      <View style={styles.heading}>
        {renaming ? (
          <View style={styles.rename}>
            <View style={{ flex: 1 }}>
              <Field
                label="Pet name"
                value={nameDraft}
                onChangeText={(t) => {
                  setNameDraft(t);
                  if (nameError) setNameError(null);
                }}
                error={nameError}
                maxLength={DEFAULTS.maxPetNameLength}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
            </View>
            <Button label="Save" size="sm" onPress={saveName} style={{ marginTop: 26 }} />
            <Button label="Cancel" size="sm" variant="ghost" onPress={() => setRenaming(false)} style={{ marginTop: 26 }} />
          </View>
        ) : (
          <>
            <View style={styles.nameRow}>
              <Text variant="heading" accessibilityRole="header">
                {state.profile.petName}
              </Text>
              <Button
                label="Rename"
                size="sm"
                variant="ghost"
                icon={<Pencil size={15} color={colors.inkSoft} />}
                onPress={() => {
                  setNameDraft(state.profile.petName);
                  setRenaming(true);
                }}
              />
            </View>
            <Pill label={`${coins} ${coins === 1 ? 'coin' : 'coins'}`} tone="coin" icon={<CoinIcon />} accessibilityLabel={`${state.progress.coins} coins`} />
          </>
        )}
      </View>

      <PetStage
        ref={stageRef}
        petId={state.profile.petId}
        stage={displayStage}
        path={path}
        gear={shownGear}
        height={250}
        petScale={1.05}
        onPress={() => {
          haptic('tap');
          stageRef.current?.react();
        }}
        accessibilityLabel={`${state.profile.petName}, ${STAGES.find((s) => s.id === stage)?.name} stage, ${PATH_BY_ID[path].name} path, ${preview ? `previewing ${item.name}` : shownGear === 'none' ? 'classic look' : `wearing ${item.name}`}`}
      >
        <View style={styles.stageLabel} pointerEvents="none">
          <Text variant="caption" tone="inverse">
            {stage === 'egg' ? 'PREVIEW AFTER HATCHING' : `${STAGES.find((s) => s.id === stage)?.name.toUpperCase()} · ${PATH_BY_ID[path].name.toUpperCase()}`}
          </Text>
        </View>
      </PetStage>

      <Card style={styles.gearPanel}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" tone="muted">
            {preview ? 'PREVIEWING' : 'WEARING'}
          </Text>
          <Text variant="subheading">{shownGear === 'none' ? 'Classic look' : item.name}</Text>
          <Text variant="small" tone="soft">
            {item.blurb}
          </Text>
        </View>
        {/* Price on the left, a short action on the right: nothing here can overflow. */}
        <View style={styles.gearRow}>
          <View style={styles.price}>
            {status.kind === 'unlock' || status.kind === 'locked' ? <CoinIcon size={16} /> : null}
            <Text variant="smallStrong" tone={status.kind === 'locked' ? 'muted' : 'ink'}>
              {status.kind === 'equipped' ? 'Wearing it now' : status.kind === 'owned' ? 'Unlocked' : `${item.cost} coins`}
            </Text>
            {status.kind === 'locked' ? (
              <Text variant="small" tone="muted">
                · {item.cost - state.progress.coins} more to go
              </Text>
            ) : null}
          </View>
          <Button
            label={status.kind === 'equipped' ? 'Equipped' : status.kind === 'owned' ? 'Equip' : 'Unlock'}
            variant={status.kind === 'locked' ? 'secondary' : 'primary'}
            disabled={status.kind === 'equipped' || status.kind === 'locked'}
            onPress={act}
            accessibilityLabel={status.kind === 'unlock' ? `Unlock ${item.name} for ${item.cost} coins` : status.kind === 'locked' ? `Unlock ${item.name}. Needs ${item.cost - state.progress.coins} more coins` : undefined}
          />
        </View>
      </Card>
      {status.kind === 'locked' ? (
        <Text variant="small" tone="muted" style={{ marginTop: -spacing.sm }}>
          Each daily goal earns 5 coins; all three in a day earn 20.
        </Text>
      ) : null}

      <View style={styles.tools}>
        <Button label="Share pet card" variant="secondary" style={styles.tool} icon={<Share2 size={18} color={colors.ink} />} onPress={() => router.push('/(tabs)/pet/share')} />
        <Button label="Change pet" variant="secondary" style={styles.tool} icon={<ArrowLeftRight size={18} color={colors.ink} />} onPress={() => router.push('/(tabs)/pet/switch')} />
      </View>
      <Button label="Explore evolution paths" variant="soft" full icon={<Sparkles size={18} color={colors.sageDeep} />} onPress={() => router.push('/(tabs)/pet/evolution')} />

      <SectionHeading
        title="Gear"
        action={
          <Text variant="small" tone="muted">
            Tap to preview
          </Text>
        }
      />
      <GearGrid
        petId={state.profile.petId}
        stage={displayStage}
        path={path}
        owned={state.progress.ownedGear}
        equipped={state.progress.equippedGear}
        previewing={shownGear}
        coins={state.progress.coins}
        onPreview={(g) => {
          haptic('select');
          setPreview(g === state.progress.equippedGear ? null : g);
        }}
      />
      <Text variant="small" tone="muted" align="center">
        Previewing never spends coins. Unlock a piece once and it is yours on every pet.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  rename: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stageLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(32,35,31,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  gearPanel: { gap: spacing.md },
  gearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  price: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, flexWrap: 'wrap' },
  tools: { flexDirection: 'row', gap: spacing.md },
  tool: { flex: 1 },
});
