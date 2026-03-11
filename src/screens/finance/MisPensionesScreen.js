import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { pensionService } from '../../services/pensionService';
import { useAuth } from '../../context/AuthContext';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ESTADO_COLORS = {
    Pendiente: { bg: '#fef9c3', text: '#854d0e', icon: 'time-outline' },
    Pagado: { bg: '#dcfce7', text: '#166534', icon: 'checkmark-circle-outline' },
    Vencido: { bg: '#fee2e2', text: '#991b1b', icon: 'alert-circle-outline' },
};

const MisPensionesScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [pensiones, setPensiones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState(null);

    // ─── Cargar y filtrar por estudiante ─────────────────────────────────────────
    const loadPensiones = async () => {
    setLoading(true);
    try {
        const data = await pensionService.listar();
        const misPensiones = data.filter(
            p => p.matricula?.estudiante?.email === user?.email
        );
        setPensiones(misPensiones); // ← faltaba esta línea
    } catch (error) {
        console.error('Error cargando pensiones:', error);
    } finally {
        setLoading(false);
    }
};

    useFocusEffect(useCallback(() => { loadPensiones(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPensiones();
        setRefreshing(false);
    }, []);

    // ─── Stats ────────────────────────────────────────────────────────────────────
    const stats = {
        total: pensiones.length,
        pagado: pensiones.filter(p => p.estado === 'Pagado').length,
        pendiente: pensiones.filter(p => p.estado === 'Pendiente').length,
        vencido: pensiones.filter(p => p.estado === 'Vencido').length,
        totalPagado: pensiones
            .filter(p => p.estado === 'Pagado')
            .reduce((s, p) => s + (p.valor || 0), 0),
        totalPendiente: pensiones
            .filter(p => p.estado !== 'Pagado')
            .reduce((s, p) => s + (p.valor || 0), 0),
    };

    const pensionesFiltradas = filtroEstado
        ? pensiones.filter(p => p.estado === filtroEstado)
        : pensiones;

    // ─── Render ───────────────────────────────────────────────────────────────────
    const renderCard = (p) => {
        const color = ESTADO_COLORS[p.estado] || ESTADO_COLORS.Pendiente;
        return (
            <Card key={p.id} style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={[styles.mesIcon, { backgroundColor: color.bg }]}>
                        <Ionicons name={color.icon} size={22} color={color.text} />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardMes}>{MESES[(p.mes || 1) - 1]} {p.anio}</Text>
                        <Text style={styles.cardGrado}>
                            {p.matricula?.grado?.nombre} · {p.matricula?.periodoAcademico?.nombre}
                        </Text>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={styles.cardValor}>${p.valor?.toLocaleString('es-CO')}</Text>
                        <View style={[styles.estadoBadge, { backgroundColor: color.bg }]}>
                            <Text style={[styles.estadoText, { color: color.text }]}>{p.estado}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <Ionicons name="calendar-outline" size={13} color={colors.gray[400]} />
                    <Text style={styles.fechaText}>
                        {p.estado === 'Pagado' ? 'Pagado' : `Límite: ${p.fechaLimite || '—'}`}
                    </Text>
                    {p.estado === 'Vencido' && (
                        <View style={styles.vencidoAlert}>
                            <Ionicons name="warning-outline" size={12} color="#991b1b" />
                            <Text style={styles.vencidoText}>Comunícate con administración</Text>
                        </View>
                    )}
                </View>
            </Card>
        );
    };

    if (loading && pensiones.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>Cargando pensiones...</Text>
            </View>
        );
    }
    console.log('PENSIONES FILTRADAS:', JSON.stringify(pensionesFiltradas));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.headerText}>Mis Pensiones</Text>
                    <Text style={styles.headerSubtext}>{stats.total} registros</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Resumen financiero */}
                <View style={styles.resumenContainer}>
                    <Text style={styles.resumenTitle}>Resumen</Text>
                    <View style={styles.resumenRow}>
                        <View style={[styles.resumenCard, { backgroundColor: '#dcfce7' }]}>
                            <Text style={[styles.resumenValor, { color: '#166534' }]}>
                                ${stats.totalPagado.toLocaleString('es-CO')}
                            </Text>
                            <Text style={[styles.resumenLabel, { color: '#166534' }]}>Total pagado</Text>
                        </View>
                        <View style={[styles.resumenCard, { backgroundColor: '#fef9c3' }]}>
                            <Text style={[styles.resumenValor, { color: '#854d0e' }]}>
                                ${stats.totalPendiente.toLocaleString('es-CO')}
                            </Text>
                            <Text style={[styles.resumenLabel, { color: '#854d0e' }]}>Por pagar</Text>
                        </View>
                    </View>

                    {/* Progreso de pagos */}
                    <View style={styles.progresoContainer}>
                        <View style={styles.progresoHeader}>
                            <Text style={styles.progresoLabel}>Pensiones pagadas</Text>
                            <Text style={styles.progresoValor}>{stats.pagado} / {stats.total}</Text>
                        </View>
                        <View style={styles.progresoBar}>
                            <View
                                style={[
                                    styles.progresoFill,
                                    { width: `${stats.total > 0 ? (stats.pagado / stats.total) * 100 : 0}%` }
                                ]}
                            />
                        </View>
                    </View>

                    {/* Badges de estado */}
                    <View style={styles.badgesRow}>
                        {[
                            { label: 'Pagadas', value: stats.pagado, color: '#166534', bg: '#dcfce7' },
                            { label: 'Pendientes', value: stats.pendiente, color: '#854d0e', bg: '#fef9c3' },
                            { label: 'Vencidas', value: stats.vencido, color: '#991b1b', bg: '#fee2e2' },
                        ].map(b => (
                            <View key={b.label} style={[styles.badge, { backgroundColor: b.bg }]}>
                                <Text style={[styles.badgeValue, { color: b.color }]}>{b.value}</Text>
                                <Text style={[styles.badgeLabel, { color: b.color }]}>{b.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Filtros */}
                <View style={styles.filtrosContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filtroChip, !filtroEstado && styles.filtroChipActive]}
                            onPress={() => setFiltroEstado(null)}
                        >
                            <Text style={[styles.filtroText, !filtroEstado && styles.filtroTextActive]}>Todas</Text>
                        </TouchableOpacity>
                        {['Pendiente', 'Pagado', 'Vencido'].map(e => (
                            <TouchableOpacity
                                key={e}
                                style={[styles.filtroChip, filtroEstado === e && styles.filtroChipActive]}
                                onPress={() => setFiltroEstado(filtroEstado === e ? null : e)}
                            >
                                <Text style={[styles.filtroText, filtroEstado === e && styles.filtroTextActive]}>{e}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Lista */}
                {pensionesFiltradas.length === 0 ? (
                    <EmptyState
                        icon="cash-outline"
                        title="Sin pensiones"
                        message={filtroEstado ? `No tienes pensiones con estado "${filtroEstado}"` : 'No tienes pensiones registradas'}
                    />
                ) : (
                    <View style={styles.list}>
                        {pensionesFiltradas.map(p => (
                            <Text key={p.id}>{p.estado} - {p.mes}/{p.anio}</Text>
                        ))}
                    </View>
                )}

                {stats.vencido > 0 && (
                    <View style={styles.alertaVencido}>
                        <Ionicons name="warning" size={20} color="#991b1b" />
                        <Text style={styles.alertaText}>
                            Tienes {stats.vencido} pensión{stats.vencido > 1 ? 'es' : ''} vencida{stats.vencido > 1 ? 's' : ''}. Comunícate con administración para regularizar tu situación.
                        </Text>
                    </View>
                )}

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray[50] },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },
    header: {
        backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
        padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
    },
    backButton: { marginRight: spacing.md },
    headerTitle: { flex: 1 },
    headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
    headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 2 },
    content: { flex: 1 },
    resumenContainer: {
        backgroundColor: colors.white, margin: spacing.lg,
        borderRadius: borderRadius.xl, padding: spacing.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    resumenTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
    resumenRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    resumenCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
    resumenValor: { fontSize: fontSize.lg, fontWeight: '800' },
    resumenLabel: { fontSize: fontSize.xs, fontWeight: '500', marginTop: 2 },
    progresoContainer: { marginBottom: spacing.md },
    progresoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    progresoLabel: { fontSize: fontSize.sm, color: colors.gray[600] },
    progresoValor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[900] },
    progresoBar: {
        height: 8, backgroundColor: colors.gray[100],
        borderRadius: borderRadius.full, overflow: 'hidden',
    },
    progresoFill: {
        height: '100%', backgroundColor: colors.primary[500],
        borderRadius: borderRadius.full,
    },
    badgesRow: { flexDirection: 'row', gap: spacing.sm },
    badge: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
    badgeValue: { fontSize: fontSize.xl, fontWeight: '800' },
    badgeLabel: { fontSize: fontSize.xs, fontWeight: '500' },
    filtrosContainer: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
        marginBottom: spacing.sm,
    },
    filtroChip: {
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.full, borderWidth: 1,
        borderColor: colors.gray[200], marginRight: spacing.sm, backgroundColor: colors.white,
    },
    filtroChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
    filtroText: { fontSize: fontSize.xs, color: colors.gray[600], fontWeight: '500' },
    filtroTextActive: { color: colors.white },
    list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    card: { marginBottom: spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    mesIcon: { width: 44, height: 44, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    cardMes: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
    cardGrado: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
    cardRight: { alignItems: 'flex-end', gap: spacing.xs },
    cardValor: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
    estadoBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
    cardFooter: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        marginTop: spacing.sm, paddingTop: spacing.sm,
        borderTopWidth: 1, borderTopColor: colors.gray[100],
    },
    fechaText: { fontSize: fontSize.xs, color: colors.gray[400], flex: 1 },
    vencidoAlert: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    vencidoText: { fontSize: fontSize.xs, color: '#991b1b', fontWeight: '500' },
    alertaVencido: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
        backgroundColor: '#fee2e2', margin: spacing.lg, marginTop: 0,
        padding: spacing.md, borderRadius: borderRadius.lg,
        borderWidth: 1, borderColor: '#fca5a5',
    },
    alertaText: { flex: 1, fontSize: fontSize.sm, color: '#991b1b', lineHeight: 20 },
});

export default MisPensionesScreen;