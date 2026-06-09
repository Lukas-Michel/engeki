import { Feather, Ionicons } from '@expo/vector-icons';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ComponentProps,
  ComponentRef,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { api } from '../../../../../../convex/_generated/api';

import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured, isConvexConfigured } from '@/lib/config';
import {
  fallbackTrending,
  formatDate,
  formatRuntime,
  getMediaDetails,
  getSeasonEpisodes,
  type EpisodeSummary,
  type MediaDetails,
  type MediaReaction,
  type MediaType,
  type SeasonSummary,
} from '@/lib/tmdb';
import { useWatchlist } from '@/lib/watchlist';

type FeatherName = ComponentProps<typeof Feather>['name'];
type IoniconsName = ComponentProps<typeof Ionicons>['name'];
type RatingMenuAnchor = { x: number; y: number; width: number; height: number };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const reactionMeta: Record<
  MediaReaction,
  { icon: FeatherName; filledIcon: IoniconsName; label: string; color: string }
> = {
  dislike: { icon: 'thumbs-down', filledIcon: 'thumbs-down', label: 'Meh', color: '#7C7A93' },
  like: { icon: 'thumbs-up', filledIcon: 'thumbs-up', label: 'Liked', color: '#3FB984' },
  love: { icon: 'heart', filledIcon: 'heart', label: 'Loved', color: '#F4569C' },
};
const reactionOrder: MediaReaction[] = ['love', 'like', 'dislike'];

const SPRING = { damping: 13, stiffness: 220, mass: 0.7 };

/* ========================================================================== */
/*  Screen                                                                    */
/* ========================================================================== */

export default function DetailsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mediaType: MediaType; id: string }>();
  const mediaType = params.mediaType === 'tv' ? 'tv' : 'movie';
  const id = Number(params.id);

  const fallback = useMemo(
    () =>
      fallbackTrending.find((entry) => entry.id === id && entry.mediaType === mediaType) ??
      fallbackTrending[0],
    [id, mediaType],
  );
  const loadDetails = useCallback(() => getMediaDetails(mediaType, id), [id, mediaType]);
  const details = useAsync(loadDetails, { ...fallback, cast: [], genres: [], videos: [] });
  const item = details.data;

  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const watchlisted = isWatchlisted(item.mediaType, item.id);
  const runtime =
    mediaType === 'movie' ? formatRuntime(item.runtime) : formatRuntime(item.episodeRuntime);
  const metadata = [formatDate(item.releaseDate), runtime, ...item.genres.slice(0, 3)].join('  ·  ');

  const trackingEnabled = isConvexConfigured && isClerkConfigured;

  const heroSource = item.backdropUrl ?? item.posterUrl;

  return (
    <>
      <Screen topInset={false} contentStyle={styles.content}>
        {/* ---- Hero -------------------------------------------------------- */}
        <View style={styles.hero}>
          <View style={styles.backdropStack}>
            <View style={styles.backdropPrimary}>
              {heroSource ? (
                <>
                  <Image
                    source={{ uri: heroSource }}
                    style={styles.backdropImage}
                    contentFit="cover"
                    blurRadius={24}
                    transition={350}
                    priority="high"
                  />
                  <View style={styles.backdropSoftClip} pointerEvents="none">
                    <Image
                      source={{ uri: heroSource }}
                      style={styles.backdropImage}
                      contentFit="cover"
                      blurRadius={16}
                    />
                  </View>
                  <View style={styles.backdropMediumClip} pointerEvents="none">
                    <Image
                      source={{ uri: heroSource }}
                      style={styles.backdropImage}
                      contentFit="cover"
                      blurRadius={10}
                    />
                  </View>
                  <View style={styles.backdropLightClip} pointerEvents="none">
                    <Image
                      source={{ uri: heroSource }}
                      style={styles.backdropImage}
                      contentFit="cover"
                      blurRadius={4}
                    />
                  </View>
                  <View style={styles.backdropSharpClip} pointerEvents="none">
                    <Image
                      source={{ uri: heroSource }}
                      style={styles.backdropImage}
                      contentFit="cover"
                    />
                  </View>
                </>
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surfaceStrong }]} />
              )}
              <LinearGradient
                colors={['rgba(4,3,9,0)', 'rgba(4,3,9,0.08)', theme.background]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>

          {details.loading ? (
            <ActivityIndicator style={styles.heroLoader} color="#FFFFFF" />
          ) : null}

          <View style={styles.heroContent}>
            <Animated.View entering={FadeIn.duration(450)} style={styles.posterFrame}>
              <Image
                source={{ uri: item.posterUrl ?? heroSource }}
                style={styles.poster}
                contentFit="cover"
                transition={350}
                cachePolicy="memory-disk"
                priority="high"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.heroCopy}>
              <ThemedText type="title" style={[styles.heroTitle, { color: theme.accent }]}>
                {item.title}
              </ThemedText>

              {item.tagline ? (
                <ThemedText type="body" style={styles.heroTagline}>
                  {item.tagline}
                </ThemedText>
              ) : null}

              <ThemedText type="small" style={[styles.heroMeta, { color: theme.textSecondary }]}>
                {metadata}
              </ThemedText>
            </Animated.View>
          </View>
        </View>

        {/* ---- Body -------------------------------------------------------- */}
        <View style={styles.body}>
          <MediaActions
            item={item}
            enabled={trackingEnabled}
            watchlisted={watchlisted}
            onToggleWatchlist={() => toggleWatchlist(item)}
          />

          {/* Synopsis */}
          <Animated.View entering={FadeInDown.duration(420).delay(220)}>
            <Synopsis text={item.overview} />
          </Animated.View>

          {/* TV tracking */}
          {mediaType === 'tv' && trackingEnabled ? (
            <ShowTracking item={item} />
          ) : null}

          {/* Cast */}
          {item.cast.length ? (
            <Animated.View entering={FadeInDown.duration(420).delay(260)}>
              <CastSection cast={item.cast} />
            </Animated.View>
          ) : null}
        </View>
      </Screen>

      <View style={[styles.backButton, { top: insets.top + Spacing.two }]} pointerEvents="box-none">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}
          style={({ pressed }) => [styles.backCircle, pressed && styles.pressed]}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </>
  );
}

/* ========================================================================== */
/*  Media actions                                                            */
/* ========================================================================== */

function MediaActions({
  item,
  enabled,
  watchlisted,
  onToggleWatchlist,
}: {
  item: MediaDetails;
  enabled: boolean;
  watchlisted: boolean;
  onToggleWatchlist: () => void;
}) {
  return enabled ? (
    <ConnectedMediaActions
      item={item}
      watchlisted={watchlisted}
      onToggleWatchlist={onToggleWatchlist}
    />
  ) : (
    <LocalMediaActions watchlisted={watchlisted} onToggleWatchlist={onToggleWatchlist} />
  );
}

function LocalMediaActions({
  watchlisted,
  onToggleWatchlist,
}: {
  watchlisted: boolean;
  onToggleWatchlist: () => void;
}) {
  const [value, setValue] = useState<MediaReaction>();
  const [editing, setEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<RatingMenuAnchor>();

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(420).delay(120)}
        layout={LinearTransition.springify().damping(18).stiffness(220)}
        style={styles.actionRow}>
        {value ? (
          editing ? (
            <RatingCard
              value={value}
              busy={false}
              onSelect={(next) => {
                setValue(next);
                setEditing(false);
              }}
            />
          ) : (
            <RatedResult value={value} busy={false} onMenu={setMenuAnchor} />
          )
        ) : (
          <>
            <WatchlistCard active={watchlisted} onToggle={onToggleWatchlist} />
            <RatingCard
              value={value}
              busy={false}
              onSelect={(next) => {
                if (watchlisted) {
                  onToggleWatchlist();
                }
                setValue(next);
                setEditing(false);
              }}
            />
          </>
        )}
      </Animated.View>
      <RatingMenuPopover
        anchor={menuAnchor}
        accentColor={value ? reactionMeta[value].color : '#3FB984'}
        onClose={() => setMenuAnchor(undefined)}
        onChange={() => {
          setEditing(true);
        }}
        onUnwatched={() => {
          if (watchlisted) {
            onToggleWatchlist();
          }
          setValue(undefined);
          setEditing(false);
        }}
      />
    </>
  );
}

function ConnectedMediaActions({
  item,
  watchlisted,
  onToggleWatchlist,
}: {
  item: MediaDetails;
  watchlisted: boolean;
  onToggleWatchlist: () => void;
}) {
  const theme = useTheme();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const reaction = useQuery(
    api.watching.getReaction,
    isAuthenticated ? { mediaType: item.mediaType, tmdbId: item.id } : 'skip',
  );
  const progress = useQuery(
    api.watching.getForMedia,
    isAuthenticated ? { mediaType: item.mediaType, tmdbId: item.id } : 'skip',
  );
  const setReaction = useMutation(api.watching.setReaction);
  const markUnwatched = useMutation(api.watching.markUnwatched);
  const abandonShow = useMutation(api.watching.abandonShow);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<RatingMenuAnchor>();
  const [pendingRating, setPendingRating] = useState<MediaReaction>();
  const [error, setError] = useState<string>();
  const mediaArg = useMemo(() => mediaMutationArg(item), [item]);
  const seasons = useMemo(
    () =>
      (item.seasons ?? []).map((season) => ({
        seasonNumber: season.seasonNumber,
        episodeCount: season.episodeCount,
      })),
    [item.seasons],
  );
  const knownTotalEpisodes = seasons.reduce((total, season) => total + season.episodeCount, 0);
  const totalEpisodes = progress?.totalEpisodes ?? knownTotalEpisodes;
  const watchedEpisodes = progress?.watchedEpisodes ?? 0;
  const showFinished = progress?.status === 'finished';
  const queriesLoading = reaction === undefined || progress === undefined;
  const partiallyWatched =
    item.mediaType === 'tv' &&
    watchlisted &&
    watchedEpisodes > 0 &&
    (totalEpisodes === 0 || watchedEpisodes < totalEpisodes) &&
    progress?.status !== 'abandoned';

  const runMutation = useCallback(async (mutation: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await mutation();
      return true;
    } catch (mutationError: unknown) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to save this change.');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const saveRating = useCallback(
    async (next: MediaReaction, markFinished: boolean) => {
      const saved = await runMutation(() =>
        setReaction({
          media: mediaArg,
          seasons,
          reaction: next,
          markFinished,
        }),
      );
      if (saved) {
        setEditing(false);
        setPendingRating(undefined);
      }
    },
    [mediaArg, runMutation, seasons, setReaction],
  );

  const selectRating = useCallback(
    (next: MediaReaction) => {
      if (item.mediaType === 'tv' && !showFinished) {
        setPendingRating(next);
        return;
      }
      void saveRating(next, false);
    },
    [item.mediaType, saveRating, showFinished],
  );

  const resetToUnwatched = useCallback(() => {
    void runMutation(() => markUnwatched({ media: mediaArg })).then((saved) => {
      if (saved) {
        setEditing(false);
      }
    });
  }, [markUnwatched, mediaArg, runMutation]);

  const abandon = useCallback(() => {
    void runMutation(() => abandonShow({ media: mediaArg, seasons }));
  }, [abandonShow, mediaArg, runMutation, seasons]);

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(420).delay(120)}
        layout={LinearTransition.springify().damping(18).stiffness(220)}
        style={styles.actionRow}>
        {reaction ? (
          editing ? (
            <RatingCard
              value={reaction}
              busy={busy || isLoading || !isAuthenticated || queriesLoading}
              onSelect={selectRating}
            />
          ) : (
            <RatedResult value={reaction} busy={busy} onMenu={setMenuAnchor} />
          )
        ) : (
          <>
            {partiallyWatched ? (
              <AbandonCard busy={busy} onPress={abandon} />
            ) : (
              <WatchlistCard active={watchlisted} disabled={busy} onToggle={onToggleWatchlist} />
            )}
            <RatingCard
              busy={busy || isLoading || !isAuthenticated || queriesLoading}
              onSelect={selectRating}
            />
          </>
        )}
      </Animated.View>
      {error ? (
        <View style={[styles.trackingError, { backgroundColor: `${theme.danger}1F` }]}>
          <Feather name="alert-circle" size={15} color={theme.danger} />
          <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
            {error}
          </ThemedText>
        </View>
      ) : null}
      <RatingCompletionModal
        visible={Boolean(pendingRating)}
        rating={pendingRating}
        busy={busy}
        onCancel={() => setPendingRating(undefined)}
        onConfirm={() => {
          if (pendingRating) {
            void saveRating(pendingRating, true);
          }
        }}
      />
      <RatingMenuPopover
        anchor={menuAnchor}
        accentColor={reaction ? reactionMeta[reaction].color : theme.accent}
        onClose={() => setMenuAnchor(undefined)}
        onChange={() => {
          setEditing(true);
        }}
        onUnwatched={resetToUnwatched}
      />
    </>
  );
}

function mediaMutationArg(item: MediaDetails) {
  return {
    tmdbId: item.id,
    mediaType: item.mediaType,
    title: item.title,
    subtitle: item.subtitle,
    overview: item.overview,
    ...(item.posterUrl ? { posterUrl: item.posterUrl } : {}),
    ...(item.backdropUrl ? { backdropUrl: item.backdropUrl } : {}),
    voteAverage: item.voteAverage,
    ...(item.releaseDate ? { releaseDate: item.releaseDate } : {}),
    genreIds: item.genreIds,
  };
}

/* ========================================================================== */
/*  Watchlist card                                                            */
/* ========================================================================== */

function WatchlistCard({
  active,
  disabled = false,
  onToggle,
}: {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, { duration: 200 }));
  }, [active, progress]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    backgroundColor: interpolateColor(progress.get(), [0, 1], [theme.surfaceMuted, theme.accent]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPressIn={() => scale.set(withTiming(0.96, { duration: 90 }))}
      onPressOut={() => scale.set(withSpring(1, SPRING))}
      onPress={onToggle}
      style={[styles.watchlistButton, aStyle]}>
      <Feather
        name={active ? 'check' : 'plus'}
        size={16}
        color={active ? theme.onAccent : theme.accent}
      />
      <ThemedText type="smallBold" style={{ color: active ? theme.onAccent : theme.accent }}>
        {active ? 'Saved' : 'Watchlist'}
      </ThemedText>
    </AnimatedPressable>
  );
}

function AbandonCard({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Abandon show"
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPressIn={() => scale.set(withTiming(0.96, { duration: 90 }))}
      onPressOut={() => scale.set(withSpring(1, SPRING))}
      onPress={onPress}
      style={[
        styles.watchlistButton,
        {
          backgroundColor: `${theme.danger}1F`,
          borderColor: `${theme.danger}66`,
          borderWidth: 1,
        },
        aStyle,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={theme.danger} />
      ) : (
        <Feather name="slash" size={16} color={theme.danger} />
      )}
      <ThemedText type="smallBold" style={{ color: theme.danger }}>
        Abandon
      </ThemedText>
    </AnimatedPressable>
  );
}

/* ========================================================================== */
/*  Rating card                                                               */
/* ========================================================================== */

function RatingCard({
  value: currentValue,
  busy,
  onSelect,
}: {
  value?: MediaReaction;
  busy: boolean;
  onSelect: (value: MediaReaction) => void;
}) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(100)}
      layout={LinearTransition.springify().damping(18).stiffness(220)}
      style={[styles.ratingPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {reactionOrder.map((reaction, index) => (
        <Fragment key={reaction}>
          <ReactionButton
            meta={reactionMeta[reaction]}
            active={currentValue === reaction}
            disabled={busy}
            onPress={() => onSelect(reaction)}
          />
          {index < reactionOrder.length - 1 ? (
            <View style={[styles.ratingDivider, { backgroundColor: theme.border }]} />
          ) : null}
        </Fragment>
      ))}
    </Animated.View>
  );
}

function RatedResult({
  value,
  busy,
  onMenu,
}: {
  value: MediaReaction;
  busy: boolean;
  onMenu: (anchor: RatingMenuAnchor) => void;
}) {
  const meta = reactionMeta[value];
  const menuButtonRef = useRef<ComponentRef<typeof Pressable>>(null);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.set(0);
    rotation.set(
      withSequence(
        withTiming(-4, { duration: 55 }),
        withTiming(4, { duration: 70 }),
        withTiming(-2, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      ),
    );
  }, [rotation, value]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      layout={LinearTransition.duration(220)}
      style={[
        styles.ratedCard,
        { backgroundColor: `${meta.color}1F`, borderColor: `${meta.color}66` },
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={meta.color} />
      ) : (
        <View style={[styles.ratedIconBadge, { backgroundColor: `${meta.color}26` }]}>
          <Animated.View style={iconStyle}>
            <Ionicons name={meta.filledIcon} size={21} color={meta.color} />
          </Animated.View>
        </View>
      )}
      <View style={styles.ratedMain}>
        <ThemedText style={[styles.ratedLabel, { color: meta.color }]}>{meta.label}</ThemedText>
      </View>
      <Pressable
        ref={menuButtonRef}
        accessibilityRole="button"
        accessibilityLabel="Rating options"
        disabled={busy}
        hitSlop={6}
        onPress={() => {
          menuButtonRef.current?.measureInWindow((x, y, width, height) => {
            onMenu({ x, y, width, height });
          });
        }}
        style={({ pressed }) => [
          styles.ratingMenuButton,
          { backgroundColor: `${meta.color}18` },
          pressed && styles.pressed,
        ]}>
        <Feather name="more-horizontal" size={19} color={meta.color} />
      </Pressable>
    </Animated.View>
  );
}

function RatingCompletionModal({
  visible,
  rating,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  rating?: MediaReaction;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const label = rating ? reactionMeta[rating].label.toLowerCase() : 'rated';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={busy ? undefined : onCancel} />
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={[
            styles.modalCard,
            { backgroundColor: theme.backgroundElevated, borderColor: theme.borderStrong },
          ]}>
          <View style={[styles.modalIcon, { backgroundColor: theme.accentSoft }]}>
            <Feather name="check-circle" size={20} color={theme.accent} />
          </View>
          <ThemedText type="heading">Finish the show?</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.modalCopy}>
            Some episodes are still unwatched. Mark every episode watched and save this as {label}?
          </ThemedText>
          <Pressable
            disabled={busy}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.modalPrimary,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Mark all watched and rate
              </ThemedText>
            )}
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.modalSecondary,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Cancel</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function RatingMenuPopover({
  anchor,
  accentColor,
  onClose,
  onChange,
  onUnwatched,
}: {
  anchor?: RatingMenuAnchor;
  accentColor: string;
  onClose: () => void;
  onChange: () => void;
  onUnwatched: () => void;
}) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const progress = useSharedValue(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelWidth = Math.min(310, window.width - Spacing.three * 2);
  const panelHeight = 152;
  const panelLeft = anchor
    ? Math.max(
        Spacing.three,
        Math.min(anchor.x + anchor.width - panelWidth, window.width - panelWidth - Spacing.three),
      )
    : Spacing.three;
  const panelTop = anchor
    ? Math.max(
        Spacing.three,
        Math.min(anchor.y - 8, window.height - panelHeight - Spacing.three),
      )
    : Spacing.three;

  useEffect(() => {
    if (anchor) {
      progress.set(0);
      progress.set(withTiming(1, { duration: 210, easing: Easing.out(Easing.cubic) }));
    }
  }, [anchor, progress]);

  useEffect(
    () => () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    },
    [],
  );

  const dismiss = useCallback(
    (afterClose?: () => void) => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
      progress.set(withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) }));
      closeTimer.current = setTimeout(() => {
        onClose();
        afterClose?.();
      }, 155);
    },
    [onClose, progress],
  );

  const panelStyle = useAnimatedStyle(() => {
    const amount = progress.get();
    return {
      left: interpolate(amount, [0, 1], [anchor?.x ?? panelLeft, panelLeft]),
      top: interpolate(amount, [0, 1], [anchor?.y ?? panelTop, panelTop]),
      width: interpolate(amount, [0, 1], [anchor?.width ?? 40, panelWidth]),
      height: interpolate(amount, [0, 1], [anchor?.height ?? 40, panelHeight]),
      borderRadius: interpolate(amount, [0, 1], [22, Radius.lg]),
      backgroundColor: interpolateColor(
        amount,
        [0, 1],
        [`${accentColor}24`, theme.backgroundElevated],
      ),
    };
  });
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.42, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [-5, 0]) }],
  }));
  const originIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.35, 1], [1, 0, 0]),
    transform: [{ rotate: `${interpolate(progress.get(), [0, 1], [0, 90])}deg` }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0, 0.18]),
  }));

  return (
    <Modal
      visible={Boolean(anchor)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss()}>
      <View style={styles.ratingPopoverRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.ratingPopoverBackdrop, backdropStyle]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
        <Animated.View
          style={[
            styles.ratingPopover,
            { borderColor: `${accentColor}52` },
            panelStyle,
          ]}>
          <Animated.View pointerEvents="none" style={[styles.ratingPopoverOrigin, originIconStyle]}>
            <Feather name="more-horizontal" size={19} color={accentColor} />
          </Animated.View>
          <Animated.View style={[styles.ratingPopoverContent, contentStyle]}>
            <View style={styles.ratingPopoverHeader}>
              <ThemedText type="caption" style={{ color: accentColor }}>
                Rating options
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close rating options"
                hitSlop={8}
                onPress={() => dismiss()}
                style={({ pressed }) => [styles.ratingPopoverClose, pressed && styles.pressed]}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => dismiss(onChange)}
              style={({ pressed }) => [styles.ratingMenuRow, pressed && styles.pressed]}>
              <View style={[styles.ratingMenuIcon, { backgroundColor: `${accentColor}1F` }]}>
                <Feather name="edit-3" size={16} color={accentColor} />
              </View>
              <ThemedText type="heading">Change rating</ThemedText>
            </Pressable>
            <View style={[styles.ratingMenuDivider, { backgroundColor: theme.border }]} />
            <Pressable
              accessibilityLabel="Delete rating and mark unwatched"
              onPress={() => dismiss(onUnwatched)}
              style={({ pressed }) => [styles.ratingMenuRow, pressed && styles.pressed]}>
              <View style={[styles.ratingMenuIcon, { backgroundColor: `${theme.danger}1F` }]}>
                <Feather name="trash-2" size={16} color={theme.danger} />
              </View>
              <View style={styles.ratingMenuCopy}>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  Delete activity
                </ThemedText>
                <ThemedText type="label" style={{ color: theme.textSecondary }}>
                  Mark unwatched and remove from watchlist
                </ThemedText>
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ========================================================================== */
/*  Reaction button                                                           */
/* ========================================================================== */

function ReactionButton({
  meta,
  active,
  disabled,
  onPress,
}: {
  meta: { icon: FeatherName; filledIcon: IoniconsName; label: string; color: string };
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const progress = useSharedValue(active ? 1 : 0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) }));
    if (active) {
      rotation.set(
        withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 65 }),
          withTiming(-2, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        ),
      );
    }
  }, [active, progress, rotation]);

  const aStyle = useAnimatedStyle(() => ({
    flexGrow: 1 + progress.get() * 0.28,
    backgroundColor: interpolateColor(progress.get(), [0, 1], ['transparent', `${meta.color}26`]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={meta.label}
      onPress={onPress}
      disabled={disabled}
      style={[styles.reactionButton, aStyle]}>
      <Animated.View style={iconStyle}>
        {active ? (
          <Ionicons name={meta.filledIcon} size={19} color={meta.color} />
        ) : (
          <Feather name={meta.icon} size={18} color={theme.textSecondary} />
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

/* ========================================================================== */
/*  Synopsis                                                                  */
/* ========================================================================== */

const SYNOPSIS_COLLAPSED = 23 * 4; // body lineHeight (23) * 4 lines

function Synopsis({ text }: { text: string }) {
  const theme = useTheme();
  const body = text || 'No synopsis is available yet.';

  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const measured = useRef(false);
  const height = useSharedValue(SYNOPSIS_COLLAPSED);

  const clampable = fullHeight > SYNOPSIS_COLLAPSED + 1;

  useEffect(() => {
    if (fullHeight <= 0 || measured.current) {
      return;
    }
    measured.current = true;
    height.set(fullHeight > SYNOPSIS_COLLAPSED + 1 ? SYNOPSIS_COLLAPSED : fullHeight);
  }, [fullHeight, height]);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      height.set(
        withTiming(next ? fullHeight : SYNOPSIS_COLLAPSED, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        }),
      );
      return next;
    });
  }, [fullHeight, height]);

  const clipStyle = useAnimatedStyle(() => ({ height: height.get() }));

  return (
    <Animated.View style={styles.section}>
      <BlockTitle icon="align-left" label="Story" />
      <View>
        <Animated.View style={[styles.synopsisClip, clipStyle]}>
          <ThemedText type="body" themeColor="textSecondary">
            {body}
          </ThemedText>
        </Animated.View>
        {clampable && !expanded ? (
          <LinearGradient
            colors={['rgba(0,0,0,0)', theme.background]}
            style={styles.synopsisFade}
            pointerEvents="none"
          />
        ) : null}
        {/* Hidden measurer to capture the full natural height */}
        <ThemedText
          type="body"
          themeColor="textSecondary"
          style={styles.synopsisMeasure}
          onLayout={(event) => setFullHeight(event.nativeEvent.layout.height)}>
          {body}
        </ThemedText>
      </View>
      {clampable ? (
        <Pressable onPress={toggle} hitSlop={8} style={styles.readMore}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {expanded ? 'Show less' : 'Read more'}
          </ThemedText>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.accent} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/* ========================================================================== */
/*  Cast                                                                      */
/* ========================================================================== */

function CastSection({ cast }: { cast: MediaDetails['cast'] }) {
  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} style={styles.section}>
      <View style={styles.sectionHead}>
        <BlockTitle icon="users" label="Cast" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.castRail}>
        {cast.map((member) => (
          <CastFace key={member.id} member={member} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function CastFace({ member }: { member: MediaDetails['cast'][number] }) {
  const theme = useTheme();
  return (
    <View style={styles.castCard}>
      {member.imageUrl ? (
        <Image source={{ uri: member.imageUrl }} style={styles.castImage} contentFit="cover" />
      ) : (
        <View style={[styles.castImage, styles.castFallback, { backgroundColor: theme.surfaceStrong }]}>
          <Feather name="user" size={22} color={theme.textTertiary} />
        </View>
      )}
      <View style={styles.castText}>
        <ThemedText type="smallBold" style={styles.castName}>
          {member.name}
        </ThemedText>
        <ThemedText type="label" themeColor="textTertiary" style={styles.castRole}>
          {member.character}
        </ThemedText>
      </View>
    </View>
  );
}

/* ========================================================================== */
/*  Block title                                                               */
/* ========================================================================== */

function BlockTitle({ icon, label }: { icon: FeatherName; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.blockTitle}>
      <View style={[styles.blockIcon, { backgroundColor: theme.accentSoft }]}>
        <Feather name={icon} size={13} color={theme.accent} />
      </View>
      <ThemedText type="subtitle" style={styles.blockLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

/* ========================================================================== */
/*  Show tracking (seasons + episodes)                                        */
/* ========================================================================== */

type ShowProgress = {
  allEpisodesWatched: boolean;
  seasons: { seasonNumber: number; watched: boolean }[];
  episodes: { seasonNumber: number; episodeNumber: number; watched: boolean }[];
};

function ShowTracking({ item }: { item: MediaDetails }) {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? <ConnectedShowTracking item={item} /> : null;
}

function ConnectedShowTracking({ item }: { item: MediaDetails }) {
  const theme = useTheme();
  const progress = useQuery(api.watching.getForMedia, { mediaType: 'tv', tmdbId: item.id });
  const setEpisodeWatched = useMutation(api.watching.setEpisodeWatched);
  const setSeasonWatched = useMutation(api.watching.setSeasonWatched);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(() => new Set());
  const [busyKey, setBusyKey] = useState<string>();
  const [trackingError, setTrackingError] = useState<string>();
  const [pendingEpisode, setPendingEpisode] = useState<{
    seasonNumber: number;
    episodeNumber: number;
  }>();

  const seasons = useMemo(() => item.seasons ?? [], [item.seasons]);
  const loadAllEpisodes = useCallback(async () => {
    const entries = await Promise.all(
      seasons.map(async (season) => [
        season.seasonNumber,
        await getSeasonEpisodes(item.id, season.seasonNumber),
      ] as const),
    );
    return new Map(entries);
  }, [item.id, seasons]);
  const episodesBySeason = useAsync<Map<number, EpisodeSummary[]>>(loadAllEpisodes, new Map());
  const seasonArgs = useMemo(
    () =>
      seasons.map((season) => ({
        seasonNumber: season.seasonNumber,
        episodeCount: season.episodeCount,
      })),
    [seasons],
  );
  const mediaArg = useMemo(
    () => ({
      tmdbId: item.id,
      mediaType: 'tv' as const,
      title: item.title,
      ...(item.posterUrl ? { posterUrl: item.posterUrl } : {}),
      ...(item.backdropUrl ? { backdropUrl: item.backdropUrl } : {}),
    }),
    [item.backdropUrl, item.id, item.posterUrl, item.title],
  );
  const progressMaps = useMemo(() => createProgressMaps(progress), [progress]);
  const isEpisodeWatched = useCallback(
    (seasonNumber: number, episodeNumber: number) => {
      const override = progressMaps.episodes.get(`${seasonNumber}:${episodeNumber}`);
      if (override !== undefined) {
        return override;
      }
      return progressMaps.seasons.get(seasonNumber) ?? progressMaps.allEpisodesWatched;
    },
    [progressMaps],
  );

  const runMutation = useCallback(async (key: string, mutation: () => Promise<unknown>) => {
    setBusyKey(key);
    setTrackingError(undefined);
    try {
      await mutation();
    } catch (error: unknown) {
      setTrackingError(error instanceof Error ? error.message : 'Unable to update progress.');
    } finally {
      setBusyKey(undefined);
    }
  }, []);

  const saveEpisode = useCallback(
    (seasonNumber: number, episodeNumber: number, watched: boolean, markPrevious: boolean) =>
      runMutation(`episode:${seasonNumber}:${episodeNumber}`, () =>
        setEpisodeWatched({
          media: mediaArg,
          seasons: seasonArgs,
          seasonNumber,
          episodeNumber,
          watched,
          markPrevious,
        }),
      ),
    [mediaArg, runMutation, seasonArgs, setEpisodeWatched],
  );

  const handleEpisodePress = useCallback(
    (seasonNumber: number, episodeNumber: number) => {
      const watched = isEpisodeWatched(seasonNumber, episodeNumber);
      if (watched) {
        void saveEpisode(seasonNumber, episodeNumber, false, false);
        return;
      }

      if (hasUnwatchedPrevious(seasonArgs, seasonNumber, episodeNumber, isEpisodeWatched)) {
        setPendingEpisode({ seasonNumber, episodeNumber });
        return;
      }

      void saveEpisode(seasonNumber, episodeNumber, true, false);
    },
    [isEpisodeWatched, saveEpisode, seasonArgs],
  );

  const handleSeasonPress = useCallback(
    (season: SeasonSummary) => {
      const watched = Array.from({ length: season.episodeCount }, (_, index) => index + 1).every(
        (episodeNumber) => isEpisodeWatched(season.seasonNumber, episodeNumber),
      );
      void runMutation(`season:${season.seasonNumber}`, () =>
        setSeasonWatched({
          media: mediaArg,
          seasons: seasonArgs,
          seasonNumber: season.seasonNumber,
          watched: !watched,
        }),
      );
    },
    [isEpisodeWatched, mediaArg, runMutation, seasonArgs, setSeasonWatched],
  );

  const toggleSeason = useCallback((seasonNumber: number) => {
    setExpandedSeasons((current) => {
      const next = new Set(current);
      if (next.has(seasonNumber)) {
        next.delete(seasonNumber);
      } else {
        next.add(seasonNumber);
      }
      return next;
    });
  }, []);

  return (
    <>
      {seasons.length ? (
        <Animated.View entering={FadeInDown.duration(420).delay(240)} style={styles.section}>
          {trackingError ? (
            <View style={[styles.trackingError, { backgroundColor: `${theme.danger}1F` }]}> 
              <Feather name="alert-circle" size={15} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                {trackingError}
              </ThemedText>
            </View>
          ) : null}
          {episodesBySeason.loading ? (
            <ActivityIndicator style={styles.episodeLoader} color={theme.accent} />
          ) : (
            <View style={styles.seasonList}>
            {seasons.map((season) => {
              const expanded = expandedSeasons.has(season.seasonNumber);
              const watchedCount = Array.from(
                { length: season.episodeCount },
                (_, index) => index + 1,
              ).filter((episodeNumber) =>
                isEpisodeWatched(season.seasonNumber, episodeNumber),
              ).length;
              const seasonRatio =
                season.episodeCount > 0 ? watchedCount / season.episodeCount : 0;

              return (
                <View
                  key={season.id}
                  style={[
                    styles.seasonCard,
                    expanded && styles.seasonCardExpanded,
                    {
                      backgroundColor: theme.surface,
                      borderColor: expanded ? theme.borderStrong : theme.border,
                    },
                  ]}>
                  <View style={styles.seasonHeader}>
                    <Pressable
                      onPress={() => toggleSeason(season.seasonNumber)}
                      style={({ pressed }) => [styles.seasonExpand, pressed && styles.pressed]}>
                      <Image
                        source={{ uri: season.posterUrl ?? item.posterUrl }}
                        style={styles.seasonPoster}
                        contentFit="cover"
                      />
                      <View style={styles.seasonCopy}>
                        <View style={styles.seasonTitleRow}>
                          <ThemedText type="heading" numberOfLines={1} style={styles.seasonName}>
                            {season.name}
                          </ThemedText>
                          <Feather
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={theme.textSecondary}
                          />
                        </View>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.seasonDate}>
                          {formatDate(season.airDate)}
                        </ThemedText>
                      </View>
                    </Pressable>
                    <SeasonCheck
                      ratio={seasonRatio}
                      busy={busyKey === `season:${season.seasonNumber}`}
                      disabled={Boolean(busyKey)}
                      onPress={() => handleSeasonPress(season)}
                    />
                  </View>

                  <CollapsibleEpisodes expanded={expanded}>
                    <SeasonEpisodes
                      episodes={episodesBySeason.data.get(season.seasonNumber) ?? []}
                      busyKey={busyKey}
                      fallbackBackdropUrl={item.backdropUrl}
                      isEpisodeWatched={isEpisodeWatched}
                      onEpisodePress={handleEpisodePress}
                    />
                  </CollapsibleEpisodes>
                </View>
              );
            })}
            </View>
          )}
        </Animated.View>
      ) : null}

      <PreviousEpisodesModal
        visible={Boolean(pendingEpisode)}
        onCancel={() => setPendingEpisode(undefined)}
        onConfirm={(markPrevious) => {
          if (pendingEpisode) {
            void saveEpisode(
              pendingEpisode.seasonNumber,
              pendingEpisode.episodeNumber,
              true,
              markPrevious,
            );
          }
          setPendingEpisode(undefined);
        }}
      />
    </>
  );
}

function SeasonCheck({
  ratio,
  busy,
  disabled,
  onPress,
}: {
  ratio: number;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      hitSlop={8}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ratio >= 1, disabled }}
      accessibilityLabel={ratio >= 1 ? 'Mark season unwatched' : 'Mark season watched'}
      onPress={() => {
        scale.set(
          withSequence(withSpring(0.85, { damping: 9, stiffness: 320 }), withSpring(1, SPRING)),
        );
        onPress();
      }}
      style={[styles.seasonCheck, aStyle]}>
      <WatchProgressIcon ratio={ratio} size={32} busy={busy} />
    </AnimatedPressable>
  );
}

function CollapsibleEpisodes({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  const height = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (expanded && measuredHeight > 0) {
      height.set(withTiming(measuredHeight, { duration: 240 }));
    } else if (!expanded) {
      height.set(withTiming(0, { duration: 220 }));
    }
  }, [expanded, measuredHeight, height]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredHeight(event.nativeEvent.layout.height);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.get() }));

  return (
    <Animated.View style={[styles.collapsible, animatedStyle]}>
      {/* Absolutely positioned so it measures its natural height regardless of
          the clamped parent height (required on the New Architecture). */}
      <View onLayout={onLayout} style={styles.collapsibleInner}>
        {children}
      </View>
    </Animated.View>
  );
}

function SeasonEpisodes({
  episodes,
  busyKey,
  fallbackBackdropUrl,
  isEpisodeWatched,
  onEpisodePress,
}: {
  episodes: EpisodeSummary[];
  busyKey?: string;
  fallbackBackdropUrl?: string;
  isEpisodeWatched: (seasonNumber: number, episodeNumber: number) => boolean;
  onEpisodePress: (seasonNumber: number, episodeNumber: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.episodeList, { borderTopColor: theme.border }]}> 
      {episodes.map((episode, index) => {
        const watched = isEpisodeWatched(episode.seasonNumber, episode.episodeNumber);
        const busy = busyKey === `episode:${episode.seasonNumber}:${episode.episodeNumber}`;
        const backdropUrl = episode.stillUrl ?? fallbackBackdropUrl;
        return (
          <Pressable
            key={episode.id}
            hitSlop={4}
            disabled={Boolean(busyKey)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: watched, disabled: Boolean(busyKey) }}
            accessibilityLabel={`Mark ${episode.name} ${watched ? 'unwatched' : 'watched'}`}
            onPress={() => onEpisodePress(episode.seasonNumber, episode.episodeNumber)}
            style={({ pressed }) => [
              styles.episodeRow,
              index < episodes.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <Image
              source={backdropUrl ? { uri: backdropUrl } : undefined}
              style={styles.episodeBackdrop}
              contentFit="cover"
              transition={160}
              cachePolicy="memory-disk"
            />
            <View style={styles.episodeCopy}>
              <ThemedText type="smallBold" numberOfLines={2} style={styles.episodeTitle}>
                {episode.episodeNumber}. {episode.name}
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" style={styles.episodeMeta}>
                {formatDate(episode.airDate)}
                {episode.runtime ? ` · ${formatRuntime(episode.runtime)}` : ''}
              </ThemedText>
            </View>
            <WatchProgressIcon ratio={watched ? 1 : 0} size={24} busy={busy} />
          </Pressable>
        );
      })}
      {!episodes.length ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.episodeEmpty}>
          Episode details are not available yet.
        </ThemedText>
      ) : null}
    </View>
  );
}

function WatchProgressIcon({ ratio, size, busy }: { ratio: number; size: number; busy?: boolean }) {
  const theme = useTheme();
  const progress = Math.min(Math.max(ratio, 0), 1);
  const strokeWidth = size >= 40 ? 2.5 : 2;
  const center = size / 2;
  const radius = center - strokeWidth;
  const sectorPath =
    progress > 0 && progress < 1 ? createClockwiseSector(center, radius, progress) : null;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {progress >= 1 ? <Circle cx={center} cy={center} r={radius} fill={theme.accent} /> : null}
        {sectorPath ? <Path d={sectorPath} fill={theme.accent} /> : null}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={progress > 0 ? theme.accent : theme.borderStrong}
          strokeWidth={strokeWidth}
        />
      </Svg>
      {busy ? (
        <ActivityIndicator
          style={styles.watchProgressOverlay}
          size="small"
          color={progress >= 1 ? theme.onAccent : theme.accent}
        />
      ) : progress >= 1 ? (
        <Feather
          style={styles.watchProgressOverlay}
          name="check"
          size={Math.round(size * 0.5)}
          color={theme.onAccent}
        />
      ) : null}
    </View>
  );
}

function createClockwiseSector(center: number, radius: number, ratio: number) {
  const endAngle = -90 + ratio * 360;
  const endRadians = (endAngle * Math.PI) / 180;
  const endX = center + radius * Math.cos(endRadians);
  const endY = center + radius * Math.sin(endRadians);
  const largeArcFlag = ratio > 0.5 ? 1 : 0;

  return [
    `M ${center} ${center}`,
    `L ${center} ${center - radius}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    'Z',
  ].join(' ');
}

function PreviousEpisodesModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (markPrevious: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onCancel} />
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={[
            styles.modalCard,
            { backgroundColor: theme.backgroundElevated, borderColor: theme.borderStrong },
          ]}>
          <View style={[styles.modalIcon, { backgroundColor: theme.accentSoft }]}>
            <Feather name="layers" size={20} color={theme.accent} />
          </View>
          <ThemedText type="heading">Mark previous episodes too?</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.modalCopy}>
            There are earlier episodes you have not watched yet.
          </ThemedText>
          <Pressable
            onPress={() => onConfirm(true)}
            style={({ pressed }) => [
              styles.modalPrimary,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Mark previous too
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onConfirm(false)}
            style={({ pressed }) => [
              styles.modalSecondary,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Only this episode</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ========================================================================== */
/*  Tracking helpers                                                          */
/* ========================================================================== */

function createProgressMaps(progress: ShowProgress | null | undefined) {
  return {
    allEpisodesWatched: progress?.allEpisodesWatched ?? false,
    seasons: new Map(progress?.seasons.map((season) => [season.seasonNumber, season.watched])),
    episodes: new Map(
      progress?.episodes.map((episode) => [
        `${episode.seasonNumber}:${episode.episodeNumber}`,
        episode.watched,
      ]),
    ),
  };
}

function hasUnwatchedPrevious(
  seasons: { seasonNumber: number; episodeCount: number }[],
  targetSeason: number,
  targetEpisode: number,
  isEpisodeWatched: (seasonNumber: number, episodeNumber: number) => boolean,
) {
  for (const season of seasons) {
    const lastEpisode =
      season.seasonNumber < targetSeason
        ? season.episodeCount
        : season.seasonNumber === targetSeason
          ? targetEpisode - 1
          : 0;

    for (let episodeNumber = 1; episodeNumber <= lastEpisode; episodeNumber += 1) {
      if (!isEpisodeWatched(season.seasonNumber, episodeNumber)) {
        return true;
      }
    }
  }
  return false;
}

/* ========================================================================== */
/*  Styles                                                                    */
/* ========================================================================== */

const BACKDROP_HEIGHT = 280;
const POSTER_W = 136;
const POSTER_H = 204;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: 0,
  },

  /* Hero */
  hero: {
    backgroundColor: '#0B0910',
  },
  heroLoader: {
    position: 'absolute',
    alignSelf: 'center',
    top: 110,
    zIndex: 2,
  },
  backdropStack: {
    height: BACKDROP_HEIGHT,
  },
  backdropPrimary: {
    height: BACKDROP_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#0B0910',
  },
  backdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: BACKDROP_HEIGHT,
  },
  backdropSoftClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '90%',
    overflow: 'hidden',
  },
  backdropMediumClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '78%',
    overflow: 'hidden',
  },
  backdropLightClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '68%',
    overflow: 'hidden',
  },
  backdropSharpClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: -116,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  posterFrame: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: Radius.md,
    ...Elevation.floating,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    backgroundColor: '#1A1822',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroCopy: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroTagline: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 520,
  },
  heroMeta: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 560,
  },

  /* Body */
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
  },

  /* Watchlist */
  watchlistButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
  },

  /* Rating */
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ratingDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 9,
  },
  reactionButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    gap: 8,
  },
  ratedIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedLabel: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  ratingMenuButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Sections */
  section: {
    gap: Spacing.three,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  blockIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockLabel: {
    fontSize: 21,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  synopsisClip: {
    overflow: 'hidden',
  },
  synopsisFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
  },
  synopsisMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },

  /* Cast */
  castRail: {
    gap: Spacing.three,
    paddingRight: Spacing.three,
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  castGridItem: {
    width: 112,
  },
  castCard: {
    width: 112,
    gap: 6,
  },
  castImage: {
    width: 112,
    aspectRatio: 2 / 3,
    borderRadius: Radius.md,
    backgroundColor: '#1A1822',
  },
  castFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  castName: {
    lineHeight: 18,
  },
  castText: {
    gap: 1,
  },
  castRole: {
    lineHeight: 17,
  },

  trackingError: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },

  /* Seasons */
  seasonList: {
    gap: 12,
  },
  collapsible: {
    overflow: 'hidden',
  },
  collapsibleInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  seasonCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  seasonCardExpanded: {
    marginHorizontal: -Spacing.three,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  seasonExpand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  seasonPoster: {
    width: 68,
    height: 102,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1822',
  },
  seasonCopy: {
    flex: 1,
    gap: 6,
  },
  seasonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    maxWidth: '100%',
  },
  seasonName: {
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 25,
  },
  seasonDate: {
    fontSize: 14,
    lineHeight: 20,
  },
  seasonCheck: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Episodes */
  episodeLoader: {
    marginVertical: Spacing.four,
  },
  episodeList: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
  },
  episodeRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  episodeBackdrop: {
    width: 112,
    aspectRatio: 16 / 9,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1822',
  },
  episodeCopy: {
    flex: 1,
    gap: 5,
  },
  episodeTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  episodeMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  watchProgressOverlay: {
    position: 'absolute',
  },
  episodeEmpty: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
  },

  /* Back button */
  backButton: {
    position: 'absolute',
    left: Spacing.three,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  /* Modal */
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(4,3,9,0.72)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCopy: {
    lineHeight: 21,
  },
  modalPrimary: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  modalSecondary: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  ratingPopoverRoot: {
    flex: 1,
  },
  ratingPopoverBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#040309',
  },
  ratingPopover: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    ...Elevation.floating,
  },
  ratingPopoverOrigin: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPopoverContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 7,
  },
  ratingPopoverHeader: {
    height: 40,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingPopoverClose: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingMenuRow: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md,
  },
  ratingMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingMenuCopy: {
    flex: 1,
    gap: 1,
  },
  ratingMenuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
  },

  pressed: {
    opacity: 0.7,
  },
});
