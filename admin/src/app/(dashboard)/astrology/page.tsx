'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AstrologyEngineConfigDTO, AyanamshaSystem, HouseSystem } from '@astroai/shared-types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { adminControlApi } from '@/lib/adminControlApi';

export default function AstrologyConfigPage() {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const astroQuery = useQuery({
    queryKey: ['admin', 'astrologyConfig'],
    queryFn: adminControlApi.getAstrologyConfig,
  });

  const [formData, setFormData] = useState<Partial<AstrologyEngineConfigDTO>>({});

  const updateMutation = useMutation({
    mutationFn: ({ config, reason }: { config: Partial<AstrologyEngineConfigDTO>; reason: string }) =>
      adminControlApi.updateAstrologyConfig(config, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'astrologyConfig'], data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
    },
  });

  const config = astroQuery.data;

  if (astroQuery.isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D4A347] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentAyanamsha = formData.ayanamsha || config.ayanamsha;
  const currentHouseSystem = formData.houseSystem || config.houseSystem;
  const currentWeights = { ...config.ashtakootaWeights, ...formData.ashtakootaWeights };

  const handleSave = async (reason: string) => {
    await updateMutation.mutateAsync({ config: formData, reason });
    setFormData({});
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="astrology-config-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Astrology Engine Configuration</h2>
          <p className="text-xs text-slate-400">
            Configure Ayanamsha mathematical standards, house calculation systems, and Ashtakoota compatibility weightages.
          </p>
        </div>
        {Object.keys(formData).length > 0 && (
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="px-3 py-1.5 bg-[#D4A347] hover:bg-[#E9C16C] text-[#0B0F19] rounded-md text-xs font-semibold transition"
          >
            Save Engine Calibration
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Mathematical System */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white mb-2">Ayanamsha & House Systems</h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Ayanamsha System
            </label>
            <select
              value={currentAyanamsha}
              onChange={(e) => setFormData((prev) => ({ ...prev, ayanamsha: e.target.value as any }))}
              className="w-full bg-[#161D2F] border border-slate-700 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A347]"
            >
              <option value={AyanamshaSystem.LAHIRI}>Lahiri / Chitra Paksha (Standard Vedic Default)</option>
              <option value={AyanamshaSystem.KRISHNAMURTI}>Krishnamurti (KP System)</option>
              <option value={AyanamshaSystem.RAMAN}>B.V. Raman</option>
              <option value={AyanamshaSystem.FAGAN_BRADLEY}>Fagan-Bradley (Western Sidereal)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              House Calculation System (Bhava Chalit)
            </label>
            <select
              value={currentHouseSystem}
              onChange={(e) => setFormData((prev) => ({ ...prev, houseSystem: e.target.value as any }))}
              className="w-full bg-[#161D2F] border border-slate-700 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A347]"
            >
              <option value={HouseSystem.PLACIDUS}>Placidus (Standard Semi-Arc)</option>
              <option value={HouseSystem.WHOLE_SIGN}>Whole Sign (Rashi = Bhava)</option>
              <option value={HouseSystem.EQUAL_HOUSE}>Equal House (30° from Ascendant)</option>
              <option value={HouseSystem.SRIPATI}>Sripati (Classical Vedic)</option>
            </select>
          </div>

          <div className="p-3.5 rounded bg-[#161D2F] border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Ephemeris Provider:</span>
              <span className="font-mono text-emerald-400 font-medium">Swiss Ephemeris 2.10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calculation Precision:</span>
              <span className="font-mono text-emerald-400 font-medium">Arcsecond Accuracy</span>
            </div>
          </div>
        </div>

        {/* Ashtakoota Milan Weights */}
        <div className="p-5 rounded-lg bg-[#121827] border border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-2">Ashtakoota 36-Guna Milan Weights</h3>
          <p className="text-xs text-slate-400 mb-4">Calibrate point distribution for deterministic compatibility analysis.</p>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {Object.entries(currentWeights).map(([kuta, weight]) => (
              <div key={kuta} className="p-2.5 rounded bg-[#161D2F] border border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-300 capitalize">{kuta}</span>
                <span className="font-mono text-[#D4A347] font-semibold bg-[#1B2236] px-2 py-0.5 rounded border border-[#D4A347]/30">
                  {weight} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={isConfirmOpen}
        title="Confirm Astrology Engine Calibration"
        description="Changing Ayanamsha or House systems will affect future planetary position calculations and Kundli generation."
        riskLevel="warning"
        confirmText="Save Calibration"
        onConfirm={handleSave}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
