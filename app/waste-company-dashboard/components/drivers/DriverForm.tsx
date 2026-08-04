"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";

export type DriverFormMode = "create" | "edit";

export interface DriverFormTruckOption {
  id: string;
  label: string;
  helper?: string;
}

export interface DriverFormValues {
  name: string;
  email: string;
  phone: string;
  truck_id: string | null;
}

export interface DriverFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  truck_id?: string;
  form?: string;
}

export interface DriverFormProps {
  mode?: DriverFormMode;
  defaultValues?: Partial<DriverFormValues>;
  trucks?: DriverFormTruckOption[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: DriverFormValues) => Promise<void> | void;
}

const EMPTY_VALUES: DriverFormValues = {
  name: "",
  email: "",
  phone: "",
  truck_id: null,
};

function normalizeDefaultValues(
  defaultValues?: Partial<DriverFormValues>
): DriverFormValues {
  return {
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    truck_id: defaultValues?.truck_id ?? null,
  };
}

function validateValues(values: DriverFormValues): DriverFormErrors {
  const errors: DriverFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Driver name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Driver email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.phone && values.phone.trim().length < 7) {
    errors.phone = "Phone number looks too short.";
  }

  return errors;
}

export default function DriverForm({
  mode = "create",
  defaultValues,
  trucks = [],
  submitting = false,
  submitLabel,
  onSubmit,
}: DriverFormProps) {
  const idPrefix = useId();
  const [values, setValues] = useState<DriverFormValues>(() =>
    normalizeDefaultValues(defaultValues)
  );
  const [errors, setErrors] = useState<DriverFormErrors>({});

  useEffect(() => {
    setValues(normalizeDefaultValues(defaultValues));
  }, [defaultValues]);

  const resolvedSubmitLabel = useMemo(() => {
    if (submitLabel) return submitLabel;
    return mode === "edit" ? "Save driver" : "Add driver";
  }, [mode, submitLabel]);

  const sortedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => a.label.localeCompare(b.label));
  }, [trucks]);

  function setField<K extends keyof DriverFormValues>(
    field: K,
    value: DriverFormValues[K]
  ) {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

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

    const payload: DriverFormValues = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      truck_id: values.truck_id || null,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while saving this driver.";

      setErrors({ form: message });
    }
  }

  const inputClasses =
    "w-full rounded-xl border bg-emerald-950/60 px-4 py-3 text-sm text-emerald-50 outline-none transition placeholder:text-emerald-200/35 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/20";

  const labelClasses =
    "mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-200/70";

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
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {errors.form}
        </div>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-driver-name`} className={labelClasses}>
          Driver name
        </label>
        <input
          id={`${idPrefix}-driver-name`}
          type="text"
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="e.g. Adewale Johnson"
          disabled={submitting}
          className={inputClasses}
        />
        {errors.name ? (
          <p className="mt-2 text-xs text-red-200">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-driver-email`} className={labelClasses}>
          Driver email
        </label>
        <input
          id={`${idPrefix}-driver-email`}
          type="email"
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          placeholder="driver@company.com"
          disabled={submitting}
          className={inputClasses}
        />
        {errors.email ? (
          <p className="mt-2 text-xs text-red-200">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-driver-phone`} className={labelClasses}>
          Phone number
        </label>
        <input
          id={`${idPrefix}-driver-phone`}
          type="tel"
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value)}
          placeholder="e.g. 0803 000 0000"
          disabled={submitting}
          className={inputClasses}
        />
        {errors.phone ? (
          <p className="mt-2 text-xs text-red-200">{errors.phone}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-driver-truck`} className={labelClasses}>
          Assigned truck
        </label>
        <select
          id={`${idPrefix}-driver-truck`}
          value={values.truck_id ?? ""}
          onChange={(event) =>
            setField("truck_id", event.target.value || null)
          }
          disabled={submitting}
          className={inputClasses}
        >
          <option value="">No truck assigned</option>
          {sortedTrucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.label}
              {truck.helper ? ` — ${truck.helper}` : ""}
            </option>
          ))}
        </select>
        {errors.truck_id ? (
          <p className="mt-2 text-xs text-red-200">{errors.truck_id}</p>
        ) : null}
      </div>

      <motion.button
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
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