"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";

export type TruckFormMode = "create" | "edit";

export interface TruckFormDriverOption {
  id: string; // employee_id
  label: string; // full_name
  helper?: string;
}

export interface TruckFormValues {
  license_plate: string;
  truck_type: string;
  capacity: string;
  status: string;
  driver_employee_id: string | null;
}

export interface TruckFormErrors {
  license_plate?: string;
  truck_type?: string;
  capacity?: string;
  status?: string;
  driver_employee_id?: string;
  form?: string;
}

export interface TruckFormProps {
  mode?: TruckFormMode;
  defaultValues?: Partial<TruckFormValues>;
  drivers?: TruckFormDriverOption[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: TruckFormValues) => Promise<void> | void;
}

export const TRUCK_TYPES = ["Compactor", "Open Truck", "Skip Loader"];
export const TRUCK_STATUSES = [
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "maintenance", label: "Maintenance" },
];

function normalizeDefaultValues(
  defaultValues?: Partial<TruckFormValues>
): TruckFormValues {
  return {
    license_plate: defaultValues?.license_plate ?? "",
    truck_type: defaultValues?.truck_type ?? "Compactor",
    capacity: defaultValues?.capacity ?? "",
    status: defaultValues?.status ?? "active",
    driver_employee_id: defaultValues?.driver_employee_id ?? null,
  };
}

function validateValues(values: TruckFormValues): TruckFormErrors {
  const errors: TruckFormErrors = {};
  if (!values.license_plate.trim()) errors.license_plate = "License plate is required.";
  if (!values.truck_type) errors.truck_type = "Truck type is required.";
  return errors;
}

export default function TruckForm({
  mode = "create",
  defaultValues,
  drivers = [],
  submitting = false,
  submitLabel,
  onSubmit,
}: TruckFormProps) {
  const idPrefix = useId();
  const [values, setValues] = useState<TruckFormValues>(() => normalizeDefaultValues(defaultValues));
  const [errors, setErrors] = useState<TruckFormErrors>({});

  useEffect(() => {
    setValues(normalizeDefaultValues(defaultValues));
  }, [defaultValues]);

  const resolvedSubmitLabel = useMemo(() => {
    if (submitLabel) return submitLabel;
    return mode === "edit" ? "Save truck" : "Register truck";
  }, [mode, submitLabel]);

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => a.label.localeCompare(b.label));
  }, [drivers]);

  function setField<K extends keyof TruckFormValues>(field: K, value: TruckFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field] && !prev.form) return prev;
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateValues(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: TruckFormValues = {
      license_plate: values.license_plate.trim().toUpperCase(),
      truck_type: values.truck_type,
      capacity: values.capacity.trim(),
      status: values.status,
      driver_employee_id: values.driver_employee_id || null,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while saving this truck.";
      setErrors({ form: message });
    }
  }

  // FIX: Light mode contrast classes
  const inputClasses = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
  const labelClasses = "mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500";

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {errors.form ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errors.form}
        </div>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-truck-plate`} className={labelClasses}>License plate</label>
        <input
          id={`${idPrefix}-truck-plate`}
          type="text"
          value={values.license_plate}
          onChange={(event) => setField("license_plate", event.target.value)}
          placeholder="e.g. LND-482AB"
          disabled={submitting}
          className={`${inputClasses} uppercase`}
        />
        {errors.license_plate ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.license_plate}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-truck-type`} className={labelClasses}>Type</label>
          <select
            id={`${idPrefix}-truck-type`}
            value={values.truck_type}
            onChange={(event) => setField("truck_type", event.target.value)}
            disabled={submitting}
            className={inputClasses}
          >
            {TRUCK_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
          </select>
          {errors.truck_type ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.truck_type}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idPrefix}-truck-status`} className={labelClasses}>Status</label>
          <select
            id={`${idPrefix}-truck-status`}
            value={values.status}
            onChange={(event) => setField("status", event.target.value)}
            disabled={submitting}
            className={inputClasses}
          >
            {TRUCK_STATUSES.map((status) => (<option key={status.value} value={status.value}>{status.label}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-truck-capacity`} className={labelClasses}>Capacity</label>
        <input
          id={`${idPrefix}-truck-capacity`}
          type="text"
          value={values.capacity}
          onChange={(event) => setField("capacity", event.target.value)}
          placeholder="e.g. 10 Tons"
          disabled={submitting}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-truck-driver`} className={labelClasses}>Assigned driver</label>
        <select
          id={`${idPrefix}-truck-driver`}
          value={values.driver_employee_id ?? ""}
          onChange={(event) => setField("driver_employee_id", event.target.value || null)}
          disabled={submitting}
          className={inputClasses}
        >
          <option value="">No driver assigned</option>
          {sortedDrivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.label}{driver.helper ? ` — ${driver.helper}` : ""}
            </option>
          ))}
        </select>
      </div>

      <motion.button
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
      >
        {submitting ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
            </svg>
            Saving...
          </>
        ) : (
          resolvedSubmitLabel
        )}
      </motion.button>
    </motion.form>
  );
}