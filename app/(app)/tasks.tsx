/**
 * app/(app)/tasks.tsx — დავალებები (ეტაპი 3).
 * სია (აქტიური/დასრულებული), ვადაგადაცილების ნიშანი, ერთი შეხებით
 * დასრულება, ახალი დავალების მოდალი (ვადის სწრაფი არჩევანი, პრიორიტეტი,
 * მენეჯმენტს — მინიჭება გუნდზე), ლიდზე გადასვლა.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  createTask,
  deleteTask,
  fetchTasks,
  isOverdue,
  quickDue,
  setTaskStatus,
  type TaskWithLead,
} from '@/lib/tasks';
import { fetchTeam } from '@/lib/leads';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, EmptyState } from '@/components/ui';
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  dbRoleToAppRole,
  type Profile,
} from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

const CAN_ASSIGN = ['admin', 'director', 'sales_manager'];
const DUE_OPTIONS = [
  { label: 'დღეს', days: 0 },
  { label: 'ხვალ', days: 1 },
  { label: '3 დღეში', days: 3 },
  { label: 'კვირაში', days: 7 },
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

let tasksCache: TaskWithLead[] = [];

export default function Tasks() {
  const { session, role } = useAuth();
  const [tasks, setTasks] = useState<TaskWithLead[]>(tasksCache);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'active' | 'done'>('active');

  // ახალი დავალების მოდალი
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDays, setDueDays] = useState<number | null>(null);
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (tasksCache.length === 0) setLoading(true);
    tasksCache = await fetchTasks();
    setTasks(tasksCache);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(
    () =>
      tasks.filter((t) =>
        tab === 'active' ? t.status === 'pending' : t.status !== 'pending'
      ),
    [tasks, tab]
  );

  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);
  const canAssign = role ? CAN_ASSIGN.includes(role) : false;

  async function openModal() {
    setTitle('');
    setDescription('');
    setDueDays(null);
    setPriority('medium');
    setAssignee(null);
    if (canAssign) setTeam(await fetchTeam());
    setModal(true);
  }

  async function onCreate() {
    if (!title.trim() || !session?.user) return;
    setSaving(true);
    const { error } = await createTask({
      title,
      description,
      due_date: dueDays === null ? null : quickDue(dueDays),
      priority,
      assigned_to: assignee?.id ?? session.user.id,
      created_by: session.user.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setModal(false);
    load();
  }

  async function onToggle(t: TaskWithLead) {
    const next = t.status === 'pending' ? 'completed' : 'pending';
    const { error } = await setTaskStatus(t.id, next);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    load();
  }

  function onLongPress(t: TaskWithLead) {
    Alert.alert(t.title, undefined, [
      { text: 'წაშლა', style: 'destructive', onPress: async () => {
          const { error } = await deleteTask(t.id);
          if (error) Alert.alert('შეცდომა', error);
          else load();
        } },
      { text: 'გაუქმება', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.screen}>
      {/* ფილტრი */}
      <View style={styles.tabs}>
        <TabBtn
          label={`აქტიური${overdueCount ? ` · ${overdueCount} ⚠️` : ''}`}
          active={tab === 'active'}
          onPress={() => setTab('active')}
        />
        <TabBtn
          label="დასრულებული"
          active={tab === 'done'}
          onPress={() => setTab('done')}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              text={tab === 'active' ? 'აქტიური დავალება არ არის 🎉' : 'ჯერ არაფერია'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow task={item} onToggle={onToggle} onLongPress={onLongPress} />
        )}
      />

      {/* ახალი დავალება */}
      <Pressable style={styles.fab} onPress={openModal}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* ── მოდალი: ახალი დავალება ── */}
      <Modal visible={modal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>ახალი დავალება</Text>

              <TextInput
                style={styles.input}
                placeholder="სათაური *"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="აღწერა..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>ვადა</Text>
              <View style={styles.chipRow}>
                {DUE_OPTIONS.map((o) => (
                  <Chip
                    key={o.label}
                    label={o.label}
                    active={dueDays === o.days}
                    onPress={() => setDueDays(dueDays === o.days ? null : o.days)}
                  />
                ))}
              </View>

              <Text style={styles.label}>პრიორიტეტი</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map((p) => (
                  <Chip
                    key={p}
                    label={PRIORITY_LABELS[p] ?? p}
                    active={priority === p}
                    onPress={() => setPriority(p)}
                  />
                ))}
              </View>

              {canAssign && team.length > 0 ? (
                <>
                  <Text style={styles.label}>შემსრულებელი</Text>
                  <View style={styles.chipRow}>
                    <Chip
                      label="მე"
                      active={!assignee}
                      onPress={() => setAssignee(null)}
                    />
                    {team
                      .filter((p) => p.id !== session?.user.id)
                      .map((p) => (
                        <Chip
                          key={p.id}
                          label={p.full_name || ROLE_LABELS[dbRoleToAppRole(p.role)]}
                          active={assignee?.id === p.id}
                          onPress={() => setAssignee(p)}
                        />
                      ))}
                  </View>
                </>
              ) : null}

              <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                <Button
                  title="შენახვა"
                  onPress={onCreate}
                  loading={saving}
                  disabled={!title.trim()}
                />
                <Button title="გაუქმება" variant="outline" onPress={() => setModal(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TaskRow({
  task,
  onToggle,
  onLongPress,
}: {
  task: TaskWithLead;
  onToggle: (t: TaskWithLead) => void;
  onLongPress: (t: TaskWithLead) => void;
}) {
  const done = task.status !== 'pending';
  const overdue = isOverdue(task);
  return (
    <Pressable onLongPress={() => onLongPress(task)}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => onToggle(task)} hitSlop={8}>
          <View style={[styles.check, done && styles.checkDone]}>
            {done ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={styles.taskDesc} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {task.due_date ? (
              <Text style={[styles.meta, overdue && styles.metaOverdue]}>
                ⏰ {fmtDue(task.due_date)}
                {overdue ? ' · ვადაგადაცილებული' : ''}
              </Text>
            ) : null}
            {task.priority && task.priority !== 'medium' ? (
              <Text style={styles.meta}>
                {PRIORITY_LABELS[task.priority] ?? task.priority}
              </Text>
            ) : null}
          </View>
          {task.leads?.full_name && task.lead_id ? (
            <Text
              style={styles.leadLink}
              onPress={() => router.push(`/(app)/leads/${task.lead_id}`)}
            >
              👤 {task.leads.full_name}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
        {label}
      </Text>
    </Pressable>
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
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function fmtDue(date: string): string {
  try {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return 'დღეს';
    return d.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { fontSize: font.size.sm, color: colors.text },
  tabBtnTextActive: { color: colors.textInverse, fontWeight: font.weight.semibold },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: '#fff', fontWeight: font.weight.bold },
  taskTitle: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDesc: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  meta: { fontSize: font.size.xs, color: colors.textMuted },
  metaOverdue: { color: colors.danger, fontWeight: font.weight.semibold },
  leadLink: { fontSize: font.size.sm, color: colors.primary, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: font.weight.bold },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.size.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  label: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.size.sm, color: colors.text },
  chipTextActive: { color: colors.textInverse, fontWeight: font.weight.semibold },
});
