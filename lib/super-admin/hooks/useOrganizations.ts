// lib/super-admin/hooks/useOrganizations.ts
"use client";

import { useEffect, useState } from 'react';
import {
  listOrganizations, listProperties, listVerifications, getOrganizationProfile,
  type OrganizationProfile,
} from '../services/organization.service';
import type { Organization } from '../types/organization';

export function useOrganizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [o, p, v] = await Promise.all([listOrganizations(), listProperties(), listVerifications()]);
      if (!alive) return;
      setOrgs(o); setProperties(p); setVerifications(v); setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const toggle = async (id: number) => {
    if (openId === id) { setOpenId(null); setProfile(null); return; }
    setOpenId(id); setProfile(null);
    const prof = await getOrganizationProfile(id);
    setProfile(prof);
  };

  return { orgs, properties, verifications, loading, openId, profile, toggle };
}