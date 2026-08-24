'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, ClipboardCheck, FileText, History, Loader2, Pill } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { useCan } from '@/features/clinic/permissions';
import { formatPatientCertificateCount } from '../../../lib/format-patient-certificate-count';
import { formatPatientContractCount } from '../../../lib/format-patient-contract-count';
import { formatPatientPrescriptionCount } from '../../../lib/format-patient-prescription-count';
import { getPatientContractEmissionById } from '../../../services/patient-contract-emissions.service';
import { getPatientPrescriptionById } from '../../../services/patient-prescriptions.service';
import {
  usePatientCertificatesQuery,
  usePatientContractEmissionsQuery,
  usePatientPrescriptionsQuery,
} from '../../../hooks/use-patient-documents-queries';
import { PatientCertificateHistorySheet } from './certificates/patient-certificate-history-sheet';
import { PatientCertificatePreviewSheet } from './certificates/patient-certificate-preview-sheet';
import { PatientCertificateSheet } from './certificates/patient-certificate-sheet';
import { PatientContractEmissionSheet } from './contracts/patient-contract-emission-sheet';
import { PatientContractHistorySheet } from './contracts/patient-contract-history-sheet';
import { PatientContractPreviewSheet } from './contracts/patient-contract-preview-sheet';
import { DocumentTypeCard, DOCUMENT_TYPE_GRID_CLASS } from './document-type-card';
import { PatientPrescriptionHistorySheet } from './prescriptions/patient-prescription-history-sheet';
import { PatientPrescriptionPreviewSheet } from './prescriptions/patient-prescription-preview-sheet';
import { PatientPrescriptionSheet } from './prescriptions/patient-prescription-sheet';
import type { PatientAddress } from '../../../types/clinic-patient';
import type { PatientCertificateRecord } from '../../../types/patient-certificate';
import type { PatientContractEmissionRecord } from '../../../types/patient-contract-emission';
import type { PatientPrescriptionRecord } from '../../../types/patient-prescription';

type PatientDocumentsTabProps = {
  patientId: string;
  patientName: string;
  patientCpf?: string;
  patientAddress?: PatientAddress;
};

const COUNT_LIST_PARAMS = { page: 1, perPage: 1 } as const;

export function PatientDocumentsTab({
  patientId,
  patientName,
  patientCpf,
  patientAddress,
}: PatientDocumentsTabProps) {
  const { storeId } = useStore();
  const canCreatePrescription = useCan('create', 'PatientPrescription');
  const canCreateCertificate = useCan('create', 'PatientCertificate');

  const { data: contractsData, isLoading: isContractsLoading } = usePatientContractEmissionsQuery(
    patientId,
    COUNT_LIST_PARAMS,
  );
  const { data: prescriptionsData, isLoading: isPrescriptionsLoading } =
    usePatientPrescriptionsQuery(patientId, COUNT_LIST_PARAMS, canCreatePrescription);
  const { data: certificatesData, isLoading: isCertificatesLoading } = usePatientCertificatesQuery(
    patientId,
    COUNT_LIST_PARAMS,
    canCreateCertificate,
  );

  const [contractSheetOpen, setContractSheetOpen] = useState(false);
  const [contractHistoryOpen, setContractHistoryOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<PatientContractEmissionRecord | null>(null);
  const [previewContract, setPreviewContract] = useState<PatientContractEmissionRecord | null>(null);
  const [isLoadingContractDetail, setIsLoadingContractDetail] = useState(false);

  const [prescriptionSheetOpen, setPrescriptionSheetOpen] = useState(false);
  const [prescriptionHistoryOpen, setPrescriptionHistoryOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<PatientPrescriptionRecord | null>(
    null,
  );
  const [previewPrescription, setPreviewPrescription] = useState<PatientPrescriptionRecord | null>(
    null,
  );
  const [isLoadingPrescriptionDetail, setIsLoadingPrescriptionDetail] = useState(false);

  const [certificateSheetOpen, setCertificateSheetOpen] = useState(false);
  const [certificateHistoryOpen, setCertificateHistoryOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<PatientCertificateRecord | null>(
    null,
  );

  const contractCount = contractsData?.meta.total ?? 0;
  const prescriptionCount = prescriptionsData?.meta.total ?? 0;
  const certificateCount = certificatesData?.meta.total ?? 0;

  const hasContractHistory = contractCount > 0;
  const hasPrescriptionHistory = prescriptionCount > 0;
  const hasCertificateHistory = certificateCount > 0;

  const fetchContractDetail = async (contractId: string) => {
    if (!storeId) return null;

    setIsLoadingContractDetail(true);
    try {
      return await getPatientContractEmissionById(storeId, patientId, contractId);
    } catch {
      toast.error('Não foi possível carregar o contrato.');
      return null;
    } finally {
      setIsLoadingContractDetail(false);
    }
  };

  const fetchPrescriptionDetail = async (prescriptionId: string) => {
    if (!storeId) return null;

    setIsLoadingPrescriptionDetail(true);
    try {
      return await getPatientPrescriptionById(storeId, patientId, prescriptionId);
    } catch {
      toast.error('Não foi possível carregar o receituário.');
      return null;
    } finally {
      setIsLoadingPrescriptionDetail(false);
    }
  };

  const handleOpenNewContract = () => {
    setEditingContract(null);
    setContractSheetOpen(true);
  };

  const handleContractSheetOpenChange = (open: boolean) => {
    setContractSheetOpen(open);
    if (!open) {
      setEditingContract(null);
    }
  };

  const handleContractSaved = (contract: PatientContractEmissionRecord) => {
    setPreviewContract(contract);
  };

  const handleEditContract = async (contract: PatientContractEmissionRecord) => {
    const detail = contract.content
      ? contract
      : await fetchContractDetail(contract.id);
    if (!detail) return;

    setPreviewContract(null);
    setContractHistoryOpen(false);
    setEditingContract(detail);
    setContractSheetOpen(true);
  };

  const handleViewContract = async (contract: PatientContractEmissionRecord) => {
    const detail = contract.content
      ? contract
      : await fetchContractDetail(contract.id);
    if (!detail) return;

    setContractHistoryOpen(false);
    setPreviewContract(detail);
  };

  const handleOpenNewPrescription = () => {
    setEditingPrescription(null);
    setPrescriptionSheetOpen(true);
  };

  const handlePrescriptionSheetOpenChange = (open: boolean) => {
    setPrescriptionSheetOpen(open);
    if (!open) {
      setEditingPrescription(null);
    }
  };

  const handlePrescriptionSaved = (prescription: PatientPrescriptionRecord) => {
    setPreviewPrescription(prescription);
  };

  const handleViewPrescription = async (prescription: PatientPrescriptionRecord) => {
    const detail =
      prescription.items.length > 0
        ? prescription
        : await fetchPrescriptionDetail(prescription.id);
    if (!detail) return;

    setPrescriptionHistoryOpen(false);
    setPreviewPrescription(detail);
  };

  const handleOpenNewCertificate = () => {
    setCertificateSheetOpen(true);
  };

  const handleCertificateSaved = (certificate: PatientCertificateRecord) => {
    setPreviewCertificate(certificate);
  };

  const handleViewCertificate = (certificate: PatientCertificateRecord) => {
    setCertificateHistoryOpen(false);
    setPreviewCertificate(certificate);
  };

  const isCountsLoading =
    isContractsLoading ||
    (canCreatePrescription && isPrescriptionsLoading) ||
    (canCreateCertificate && isCertificatesLoading);

  return (
    <>
      {isCountsLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando documentos…
        </div>
      ) : null}

      <div className={DOCUMENT_TYPE_GRID_CLASS}>
          <DocumentTypeCard
            title="Contrato"
            subtitle={
              hasContractHistory ? formatPatientContractCount(contractCount) : undefined
            }
            buttonLabel="Novo contrato"
            icon={FileText}
            onAction={handleOpenNewContract}
            topAction={
              hasContractHistory
                ? {
                    label: 'Ver histórico',
                    icon: History,
                    onClick: () => setContractHistoryOpen(true),
                  }
                : undefined
            }
          />
          <DocumentTypeCard
            title="Termo de Consentimento"
            buttonLabel="Novo termo"
            icon={ClipboardCheck}
            disabled
          />
          {canCreatePrescription ? (
            <DocumentTypeCard
              title="Receituário"
              subtitle={
                hasPrescriptionHistory
                  ? formatPatientPrescriptionCount(prescriptionCount)
                  : undefined
              }
              buttonLabel="Novo receituário"
              icon={Pill}
              onAction={handleOpenNewPrescription}
              topAction={
                hasPrescriptionHistory
                  ? {
                      label: 'Ver histórico',
                      icon: History,
                      onClick: () => setPrescriptionHistoryOpen(true),
                    }
                  : undefined
              }
            />
          ) : null}
          {canCreateCertificate ? (
            <DocumentTypeCard
              title="Atestados"
              subtitle={
                hasCertificateHistory
                  ? formatPatientCertificateCount(certificateCount)
                  : undefined
              }
              buttonLabel="Novo atestado"
              icon={BadgeCheck}
              onAction={handleOpenNewCertificate}
              topAction={
                hasCertificateHistory
                  ? {
                      label: 'Ver histórico',
                      icon: History,
                      onClick: () => setCertificateHistoryOpen(true),
                    }
                  : undefined
              }
            />
          ) : null}
        </div>

      {isLoadingContractDetail || isLoadingPrescriptionDetail ? (
        <div className="sr-only" aria-live="polite">
          Carregando documento…
        </div>
      ) : null}

      <PatientContractEmissionSheet
        open={contractSheetOpen}
        onOpenChange={handleContractSheetOpenChange}
        patientId={patientId}
        editingContract={editingContract}
        onSaved={handleContractSaved}
      />

      <PatientContractHistorySheet
        open={contractHistoryOpen}
        onOpenChange={setContractHistoryOpen}
        patientId={patientId}
        onView={handleViewContract}
        onEdit={handleEditContract}
      />

      <PatientContractPreviewSheet
        open={previewContract !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewContract(null);
          }
        }}
        patientId={patientId}
        contract={previewContract}
        onEdit={handleEditContract}
        onDeleted={() => setPreviewContract(null)}
        onContractUpdated={setPreviewContract}
      />

      {canCreatePrescription ? (
        <>
          <PatientPrescriptionSheet
            open={prescriptionSheetOpen}
            onOpenChange={handlePrescriptionSheetOpenChange}
            patientId={patientId}
            patientName={patientName}
            editingPrescription={editingPrescription}
            onSaved={handlePrescriptionSaved}
          />

          <PatientPrescriptionHistorySheet
            open={prescriptionHistoryOpen}
            onOpenChange={setPrescriptionHistoryOpen}
            patientId={patientId}
            onView={handleViewPrescription}
          />

          <PatientPrescriptionPreviewSheet
            open={previewPrescription !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPreviewPrescription(null);
              }
            }}
            prescription={previewPrescription}
          />
        </>
      ) : null}

      {canCreateCertificate ? (
        <>
          <PatientCertificateSheet
            open={certificateSheetOpen}
            onOpenChange={setCertificateSheetOpen}
            patientId={patientId}
            patientName={patientName}
            onSaved={handleCertificateSaved}
          />

          <PatientCertificateHistorySheet
            open={certificateHistoryOpen}
            onOpenChange={setCertificateHistoryOpen}
            patientId={patientId}
            onView={handleViewCertificate}
          />

          <PatientCertificatePreviewSheet
            open={previewCertificate !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPreviewCertificate(null);
              }
            }}
            certificate={previewCertificate}
            patientCpf={patientCpf}
            patientAddress={patientAddress}
          />
        </>
      ) : null}
    </>
  );
}
