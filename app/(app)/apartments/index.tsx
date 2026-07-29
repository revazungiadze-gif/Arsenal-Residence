/**
 * app/(app)/apartments/index.tsx — ბინების სია (ეტაპი 6).
 * ფილტრები: სტატუსი + საძინებლები; ძებნა კოდით. ბლოკი/სართული ჩანს ბარათზე.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import {
  APT_STATUS_COLORS,
  APT_STATUS_LABELS,
  fetchApartments,
  fmtPrice,
  type ApartmentWithRefs,
} from '@/lib/apartments';
import { Badge, EmptyState } from '@/components/ui';
import { colors, font, radius, spacing } from '@/theme';

const STATUS_FILTERS = ['all', 'available', 'reserved', 'sold'] as const;
const BEDROOM_FILTERS = [0, 1, 2, 3] as const; // 0 = ყველა, 3 = 3+

export default function ApartmentsList() {
  const [apartments, setApartments] = useState<ApartmentWithRefs[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApartments(await fetchApartments());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = parseFloat(priceMin) || 0;
    const max = parseFloat(priceMax) || Infinity;
    return apartments.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (bedrooms === 3 && (a.bedrooms ?? 0) < 3) return false;
      if (bedrooms > 0 && bedrooms < 3 && a.bedrooms !== bedrooms) return false;
      if (q && !a.code.toLowerCase().includes(q)) return false;
      if ((min > 0 || max < Infinity) && (a.price == null || a.price < min || a.price > max))
        return false;
      return true;
    });
  }, [apartments, query, status, bedrooms, priceMin, priceMax]);

  const availableCount = apartments.filter((a) => a.status === 'available').length;

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder={`ძებნა კოდით · სულ ${apartments.length}, თავისუფალი ${availableCount}`}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
        />
        <View style={styles.chipRow}>
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s}
              label={s === 'all' ? 'ყველა' : APT_STATUS_LABELS[s]}
              active={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
        </View>
        <View style={styles.chipRow}>
          {BEDROOM_FILTERS.map((b) => (
            <Chip
              key={b}
              label={b === 0 ? 'ოთახები: ყველა' : b === 3 ? '3+' : `${b}`}
              active={bedrooms === b}
              onPress={() => setBedrooms(b)}
            />
          ))}
        </View>
        <View style={styles.priceRow}>
          <TextInput
            style={styles.priceInput}
            placeholder="ფასი: მინ"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={priceMin}
            onChangeText={setPriceMin}
          />
          <Text style={styles.priceDash}>—</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="მაქს"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={priceMax}
            onChangeText={setPriceMax}
          />
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <EmptyState text="ბინა ვერ მოიძებნა" /> : null}
        renderItem={({ item }) => <AptRow apt={item} />}
      />
    </View>
  );
}

function AptRow({ apt }: { apt: ApartmentWithRefs }) {
  const status = apt.status ?? 'available';
  return (
    <Link href={`/(app)/apartments/${apt.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.code}>🏢 {apt.code}</Text>
          <Text style={styles.meta}>
            {apt.blocks?.name ? `${apt.blocks.name} · ` : ''}
            {apt.floors?.number != null ? `${apt.floors.number} სართ. · ` : ''}
            {apt.bedrooms != null ? `${apt.bedrooms} საძ. · ` : ''}
            {apt.area != null ? `${apt.area} მ²` : ''}
          </Text>
          <Text style={styles.price}>{fmtPrice(apt)}</Text>
        </View>
        <Badge
          label={APT_STATUS_LABELS[status] ?? status}
          color={APT_STATUS_COLORS[status] ?? colors.textMuted}
        />
      </Pressable>
    </Link>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  search: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.size.sm,
    color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.size.sm,
    color: colors.text,
  },
  priceDash: { color: colors.textMuted },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { fontSize: font.size.xs, color: colors.text },
  chipTextActive: { color: colors.textInverse, fontWeight: font.weight.semibold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  code: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  meta: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.primary, marginTop: 4 },
});
