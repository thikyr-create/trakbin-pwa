import { useEffect } from 'react';
import { TabScreen } from '../../../components/layout/TabScreen';
import { ServiceDashboard } from '../../../components/caretaker/ServiceDashboard';
import { useCaretakerStore } from '../../../store/caretakerStore';

export default function ServiceScreen() {
  const load = useCaretakerStore((s) => s.load);
  useEffect(() => { load(true); }, []);

  return (
    <TabScreen>
      <ServiceDashboard />
    </TabScreen>
  );
}