import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { pensionService } from '../../services/pensionService';
import { gradoService } from '../../services/gradoService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ReportePagosScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reporte, setReporte] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [grados, setGrados] = useState([]);

  // Filtros
  const [gradoId, setGradoId] = useState(null);
  const [mes, setMes] = useState(null);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [estado, setEstado] = useState(null);
  const [estudianteId, setEstudianteId] = useState(null);

  // Búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Modal de filtros
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
  const [modalExportarVisible, setModalExportarVisible] = useState(false);

  // Modal selectores
  const [modalGradoVisible, setModalGradoVisible] = useState(false);
  const [modalMesVisible, setModalMesVisible] = useState(false);

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const estados = [
    { value: 'Pagado', label: 'Pagado', color: colors.success[600] },
    { value: 'Pendiente', label: 'Pendiente', color: colors.warning[600] },
    { value: 'Vencido', label: 'Vencido', color: colors.danger[600] },
  ];

  const loadGrados = async () => {
    try {
      const data = await gradoService.listar();
      setGrados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando grados:', error);
    }
  };

  const loadReporte = async () => {
    setLoading(true);
    try {
      const filtros = {
        gradoId: gradoId || null,
        mes: mes || null,
        anio: anio || null,
        estado: estado || null,
        estudianteId: estudianteId || null,
      };
      const data = await pensionService.obtenerReporte(filtros);
      setReporte(data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      setReporte([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResumen = async () => {
    try {
      const data = await pensionService.obtenerResumen(gradoId, mes, anio);
      setResumen(data);
    } catch (error) {
      console.error('Error cargando resumen:', error);
      setResumen(null);
    }
  };

  const loadData = async () => {
    await Promise.all([loadGrados(), loadReporte(), loadResumen()]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [gradoId, mes, anio, estado])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const aplicarFiltros = () => {
    loadReporte();
    loadResumen();
    setModalFiltrosVisible(false);
  };

  const limpiarFiltros = () => {
    setGradoId(null);
    setMes(null);
    setAnio(new Date().getFullYear());
    setEstado(null);
    setEstudianteId(null);
    setBusqueda('');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pagado': return colors.success[600];
      case 'Pendiente': return colors.warning[600];
      case 'Vencido': return colors.danger[600];
      default: return colors.gray[400];
    }
  };

  const reporteFiltrado = reporte.filter(item => {
    if (!busqueda.trim()) return true;
    const search = busqueda.toLowerCase();
    const nombre = `${item.estudianteNombre} ${item.estudianteApellido}`.toLowerCase();
    const documento = (item.estudianteDocumento || '').toLowerCase();
    return nombre.includes(search) || documento.includes(search);
  });

  const generarCSV = () => {
    const headers = ['Estudiante', 'Documento', 'Grado', 'Mes', 'Año', 'Valor', 'Estado', 'Fecha Límite'];
    const rows = reporteFiltrado.map(item => [
      `${item.estudianteNombre} ${item.estudianteApellido}`,
      item.estudianteDocumento || '',
      item.gradoNombre || 'N/A',
      meses.find(m => m.value === item.mes)?.label || item.mes,
      item.anio,
      item.valor?.toFixed(2) || '0.00',
      item.estado,
      item.fechaLimite || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const descargarArchivo = (content, filename, mimeType) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Para móvil, guardar y compartir
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      FileSystem.writeAsStringAsync(filePath, content)
        .then(() => Sharing.shareAsync(filePath))
        .catch(err => Alert.alert('Error', 'No se pudo exportar el archivo'));
    }
  };

  const exportarPDF = async () => {
    try {
      // Generar HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Pagos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1e40af; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .pagado { color: green; }
            .pendiente { color: orange; }
            .vencido { color: red; }
            .resumen { margin-top: 30px; }
            .resumen-item { display: inline-block; margin: 10px; padding: 10px; background: #f3f4f6; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Reporte de Pagos</h1>
          <p>Generado: ${new Date().toLocaleDateString()}</p>
          ${resumen ? `
          <div class="resumen">
            <div class="resumen-item"><strong>Total:</strong> ${resumen.totalPensiones}</div>
            <div class="resumen-item"><strong>Pagados:</strong> ${resumen.totalPagado}</div>
            <div class="resumen-item"><strong>Pendientes:</strong> ${resumen.totalPendiente}</div>
            <div class="resumen-item"><strong>Vencidos:</strong> ${resumen.totalVencido}</div>
            <div class="resumen-item"><strong>Recaudado:</strong> $${resumen.montoRecaudado?.toFixed(2) || '0.00'}</div>
          </div>
          ` : ''}
          <table>
            <tr>
              <th>Estudiante</th>
              <th>Documento</th>
              <th>Grado</th>
              <th>Mes/Año</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
            ${reporteFiltrado.map(item => `
              <tr>
                <td>${item.estudianteNombre} ${item.estudianteApellido}</td>
                <td>${item.estudianteDocumento || 'N/A'}</td>
                <td>${item.gradoNombre || 'N/A'}</td>
                <td>${meses.find(m => m.value === item.mes)?.label || ''} ${item.anio}</td>
                <td>$${item.valor?.toFixed(2) || '0.00'}</td>
                <td class="${item.estado?.toLowerCase()}">${item.estado}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        // En web, abrir en nueva ventana para imprimir/guardar como PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      } else {
        // En móvil, guardar como HTML y compartir
        const filePath = `${FileSystem.cacheDirectory}reporte_pagos.html`;
        await FileSystem.writeAsStringAsync(filePath, htmlContent);
        await Sharing.shareAsync(filePath);
      }
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
    setModalExportarVisible(false);
  };

  const exportarExcel = async () => {
    try {
      const csv = generarCSV();
      const filename = `reporte_pagos_${new Date().toISOString().split('T')[0]}.csv`;
      descargarArchivo(csv, filename, 'text/csv');
    } catch (error) {
      console.error('Error exportando Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    }
    setModalExportarVisible(false);
  };

  const exportarCSV = async () => {
    try {
      const csv = generarCSV();
      const filename = `reporte_pagos_${new Date().toISOString().split('T')[0]}.csv`;
      descargarArchivo(csv, filename, 'text/csv');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    }
    setModalExportarVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reporte de Pagos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalFiltrosVisible(true)}
          >
            <Ionicons name="filter" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalExportarVisible(true)}
          >
            <Ionicons name="download" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros activos */}
      {(gradoId || mes || estado) && (
        <View style={styles.filtrosActivos}>
          {gradoId && (
            <View style={styles.filtroChip}>
              <Text style={styles.filtroChipText}>
                Grado: {grados.find(g => g.id === gradoId)?.nombre || 'N/A'}
              </Text>
              <TouchableOpacity onPress={() => setGradoId(null)}>
                <Ionicons name="close-circle" size={18} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          )}
          {mes && (
            <View style={styles.filtroChip}>
              <Text style={styles.filtroChipText}>
                Mes: {meses.find(m => m.value === mes)?.label || 'N/A'}
              </Text>
              <TouchableOpacity onPress={() => setMes(null)}>
                <Ionicons name="close-circle" size={18} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          )}
          {estado && (
            <View style={styles.filtroChip}>
              <Text style={[styles.filtroChipText, { color: getEstadoColor(estado) }]}>
                Estado: {estado}
              </Text>
              <TouchableOpacity onPress={() => setEstado(null)}>
                <Ionicons name="close-circle" size={18} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.limpiarFiltros} onPress={limpiarFiltros}>
            <Text style={styles.limpiarFiltrosText}>Limpiar todos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resumen */}
      {resumen && (
        <View style={styles.resumenContainer}>
          <Text style={styles.resumenTitle}>Resumen</Text>
          <View style={styles.resumenCards}>
            <View style={[styles.resumenCard, { borderLeftColor: colors.primary[600] }]}>
              <Text style={styles.resumenCardValue}>{resumen.totalPensiones || 0}</Text>
              <Text style={styles.resumenCardLabel}>Total Pensiones</Text>
            </View>
            <View style={[styles.resumenCard, { borderLeftColor: colors.success[600] }]}>
              <Text style={styles.resumenCardValue}>{resumen.totalPagado || 0}</Text>
              <Text style={styles.resumenCardLabel}>Pagados</Text>
            </View>
            <View style={[styles.resumenCard, { borderLeftColor: colors.warning[600] }]}>
              <Text style={styles.resumenCardValue}>{resumen.totalPendiente || 0}</Text>
              <Text style={styles.resumenCardLabel}>Pendientes</Text>
            </View>
            <View style={[styles.resumenCard, { borderLeftColor: colors.danger[600] }]}>
              <Text style={styles.resumenCardValue}>{resumen.totalVencido || 0}</Text>
              <Text style={styles.resumenCardLabel}>Vencidos</Text>
            </View>
          </View>
          <View style={styles.resumenMonto}>
            <View style={styles.montoItem}>
              <Ionicons name="trending-up" size={20} color={colors.success[600]} />
              <Text style={styles.montoLabel}>Recaudado:</Text>
              <Text style={[styles.montoValue, { color: colors.success[600] }]}>
                ${resumen.montoRecaudado?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.montoItem}>
              <Ionicons name="trending-down" size={20} color={colors.danger[600]} />
              <Text style={styles.montoLabel}>Pendiente:</Text>
              <Text style={[styles.montoValue, { color: colors.danger[600] }]}>
                ${resumen.montoPendiente?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.montoItem}>
              <Ionicons name="pie-chart" size={20} color={colors.primary[600]} />
              <Text style={styles.montoLabel}>Recaudación:</Text>
              <Text style={[styles.montoValue, { color: colors.primary[600] }]}>
                {resumen.porcentajeRecaudado?.toFixed(1) || '0'}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por estudiante..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : reporteFiltrado.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No hay registros de pagos</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Header de tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.cellSmall]}>Estudiante</Text>
              <Text style={[styles.tableCell, styles.cellSmall]}>Curso</Text>
              <Text style={[styles.tableCell, styles.cellSmall]}>Mes</Text>
              <Text style={[styles.tableCell, styles.cellSmall]}>Valor</Text>
              <Text style={[styles.tableCell, styles.cellSmall]}>Estado</Text>
            </View>
            {/* Filas */}
            {reporteFiltrado.map((item, index) => (
              <View key={item.id} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.tableCell, styles.cellSmall]}>
                  {item.estudianteNombre} {item.estudianteApellido}
                </Text>
                <Text style={[styles.tableCell, styles.cellSmall]}>
                  {item.gradoNombre || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.cellSmall]}>
                  {item.descripcion || `${meses[item.mes - 1]?.label} ${item.anio}`}
                </Text>
                <Text style={[styles.tableCell, styles.cellSmall]}>
                  ${item.valor?.toFixed(2) || '0.00'}
                </Text>
                <View style={[styles.tableCell, styles.cellSmall, styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                  <Text style={[styles.estadoText, { color: getEstadoColor(item.estado) }]}>
                    {item.estado}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Filtros */}
      <Modal
        visible={modalFiltrosVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFiltrosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setModalFiltrosVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Grado */}
              <Text style={styles.fieldLabel}>Grado</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setModalGradoVisible(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {gradoId ? grados.find(g => g.id === gradoId)?.nombre : 'Todos'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              {/* Mes */}
              <Text style={styles.fieldLabel}>Mes</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setModalMesVisible(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {mes ? meses.find(m => m.value === mes)?.label : 'Todos'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              {/* Año */}
              <Text style={styles.fieldLabel}>Año</Text>
              <TextInput
                style={styles.input}
                value={anio?.toString() || ''}
                onChangeText={(v) => setAnio(v ? parseInt(v) : null)}
                placeholder="Ej: 2026"
                keyboardType="numeric"
              />

              {/* Estado */}
              <Text style={styles.fieldLabel}>Estado</Text>
              <View style={styles.estadosContainer}>
                <TouchableOpacity
                  style={[styles.estadoOption, estado === null && styles.estadoOptionActive]}
                  onPress={() => setEstado(null)}
                >
                  <Text style={[styles.estadoOptionText, estado === null && styles.estadoOptionTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {estados.map(e => (
                  <TouchableOpacity
                    key={e.value}
                    style={[styles.estadoOption, estado === e.value && styles.estadoOptionActive, { borderColor: e.color }]}
                    onPress={() => setEstado(e.value)}
                  >
                    <Text style={[styles.estadoOptionText, estado === e.value && { color: e.color }]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={limpiarFiltros}>
                <Text style={styles.cancelButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={aplicarFiltros}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Selector Grado */}
      <Modal
        visible={modalGradoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalGradoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleccionar Grado</Text>
              <TouchableOpacity onPress={() => setModalGradoVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.pickerOption, gradoId === null && styles.pickerOptionActive]}
                onPress={() => {
                  setGradoId(null);
                  setModalGradoVisible(false);
                }}
              >
                <Text style={[styles.pickerOptionText, gradoId === null && styles.pickerOptionTextActive]}>
                  Todos los grados
                </Text>
              </TouchableOpacity>
              {grados.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.pickerOption, gradoId === g.id && styles.pickerOptionActive]}
                  onPress={() => {
                    setGradoId(g.id);
                    setModalGradoVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, gradoId === g.id && styles.pickerOptionTextActive]}>
                    {g.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Selector Mes */}
      <Modal
        visible={modalMesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleccionar Mes</Text>
              <TouchableOpacity onPress={() => setModalMesVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.pickerOption, mes === null && styles.pickerOptionActive]}
                onPress={() => {
                  setMes(null);
                  setModalMesVisible(false);
                }}
              >
                <Text style={[styles.pickerOptionText, mes === null && styles.pickerOptionTextActive]}>
                  Todos los meses
                </Text>
              </TouchableOpacity>
              {meses.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.pickerOption, mes === m.value && styles.pickerOptionActive]}
                  onPress={() => {
                    setMes(m.value);
                    setModalMesVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, mes === m.value && styles.pickerOptionTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Exportar */}
      <Modal
        visible={modalExportarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalExportarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Exportar Reporte</Text>
            <Text style={styles.modalDescription}>
              Selecciona el formato de exportación
            </Text>
            <View style={styles.exportOptions}>
              <TouchableOpacity style={styles.exportOption} onPress={exportarPDF}>
                <Ionicons name="document-text" size={32} color={colors.primary[600]} />
                <Text style={styles.exportOptionText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportOption} onPress={exportarExcel}>
                <Ionicons name="grid" size={32} color={colors.success[600]} />
                <Text style={styles.exportOptionText}>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportOption} onPress={exportarCSV}>
                <Ionicons name="document" size={32} color={colors.warning[600]} />
                <Text style={styles.exportOptionText}>CSV</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalExportarVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.primary[600],
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.white },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtrosActivos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  filtroChipText: { fontSize: fontSize.sm, color: colors.gray[700] },
  limpiarFiltros: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  limpiarFiltrosText: { fontSize: fontSize.sm, color: colors.primary[600], fontWeight: '600' },
  resumenContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  resumenTitle: { fontSize: fontSize.base, fontWeight: 'bold', color: colors.gray[900], marginBottom: spacing.md },
  resumenCards: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resumenCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
  },
  resumenCardValue: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  resumenCardLabel: { fontSize: fontSize.xs, color: colors.gray[600], marginTop: spacing.xs },
  resumenMonto: { gap: spacing.sm },
  montoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  montoLabel: { fontSize: fontSize.sm, color: colors.gray[600] },
  montoValue: { fontSize: fontSize.sm, fontWeight: '600', marginLeft: 'auto' },
  searchContainer: { padding: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, fontSize: fontSize.sm },
  listContainer: { flex: 1 },
  loadingContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: fontSize.base, color: colors.gray[500], marginTop: spacing.md },
  table: { backgroundColor: colors.white, marginHorizontal: spacing.md, borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing.lg },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.gray[100], borderBottomWidth: 2, borderBottomColor: colors.gray[300] },
  tableRow: { flexDirection: 'row' },
  rowEven: { backgroundColor: colors.white },
  rowOdd: { backgroundColor: colors.gray[50] },
  tableCell: { padding: spacing.sm, fontSize: fontSize.sm, color: colors.gray[700], flex: 1 },
  cellSmall: { fontSize: fontSize.xs },
  estadoBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.white, borderRadius: borderRadius.lg, maxHeight: '80%' },
  modalContentSmall: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  modalTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  modalDescription: { fontSize: fontSize.sm, color: colors.gray[600], marginVertical: spacing.md },
  modalBody: { padding: spacing.lg, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200], gap: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },
  input: { backgroundColor: colors.gray[50], borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.gray[200], marginBottom: spacing.md },
  selectContainer: { marginBottom: spacing.md },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.gray[200] },
  selectButtonText: { fontSize: fontSize.sm, color: colors.gray[700] },
  estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  estadoOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.gray[300] },
  estadoOptionActive: { backgroundColor: colors.gray[100] },
  estadoOptionText: { fontSize: fontSize.sm, color: colors.gray[700] },
  estadoOptionTextActive: { fontWeight: '600' },
  cancelButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray[100], alignItems: 'center' },
  cancelButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  applyButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary[600], alignItems: 'center' },
  applyButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.white },
  exportOptions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.lg },
  exportOption: { alignItems: 'center', gap: spacing.xs },
  exportOptionText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '600' },
  closeModalButton: { padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray[100], alignItems: 'center' },
  closeModalButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  pickerModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    maxHeight: '70%',
    width: '80%',
    alignSelf: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerOptionActive: { backgroundColor: colors.primary[50] },
  pickerOptionText: { fontSize: fontSize.base, color: colors.gray[700] },
  pickerOptionTextActive: { color: colors.primary[600], fontWeight: '600' },
});

export default ReportePagosScreen;
