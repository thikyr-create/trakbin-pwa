"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate distance between two GPS points (in meters)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ShiftDashboard() {
  const [haulerLocation, setHaulerLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortedNodes, setSortedNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Changed default to false
  const [shiftStarted, setShiftStarted] = useState(false);

  const fetchAndSortNodes = async (lat: number, lon: number) => {
    setHaulerLocation({ lat, lon });
    setLoading(true);

    // Fetch all GREEN nodes (paid + not picked up)
    const { data: buildings, error } = await supabase
      .from('Buildings')
      .select('*')
      .eq('payment_status', 'paid')
      .eq('status', 'pending');

    if (error) {
      console.error("Supabase Error:", error);
      alert("Error fetching nodes: " + error.message);
    } else if (buildings) {
      // Calculate distance for each node and sort
      const nodesWithDistance = buildings.map((building) => {
        const distance = building.latitude && building.longitude
          ? calculateDistance(lat, lon, building.latitude, building.longitude)
          : 999999;
        return { ...building, distance };
      });

      // Sort by distance (nearest first)
      nodesWithDistance.sort((a, b) => a.distance - b.distance);
      setSortedNodes(nodesWithDistance);
    }

    setShiftStarted(true);
    setLoading(false);
  };

  const startShift = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // SUCCESS: Use actual GPS
          fetchAndSortNodes(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          // ERROR/FALLBACK: If GPS is blocked or fails, use default Lagos coordinates
          console.warn("GPS failed, using fallback location:", error.message);
          alert("GPS permission denied or failed. Using default location (Lagos) for testing.");
          fetchAndSortNodes(6.5244, 3.3792); 
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      fetchAndSortNodes(6.5244, 3.3792);
    }
  };

  const markAsPickedUp = async (customId: string) => {
    const { error } = await supabase
      .from('Buildings')
      .update({ status: 'picked_up' })
      .eq('custom_id', customId);

    if (!error) {
      setSortedNodes(sortedNodes.filter(node => node.custom_id !== customId));
    } else {
      alert("Error updating: " + error.message);
    }
  };

  if (!shiftStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Trakbin Hauler Shift</h1>
          <p className="text-gray-500 mb-6">Start your shift to download all due nodes and optimize your route.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              📍 This will capture your current location and sort all paid, pending nodes by proximity.
            </p>
          </div>

          <button
            onClick={startShift}
            disabled={loading}
            className={`w-full p-4 rounded-lg font-bold text-lg ${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? 'Loading Nodes...' : '🚀 Start Shift'}
          </button>

          <div className="mt-6">
            <Link href="/operations" className="text-blue-600 hover:underline text-sm">
              ← Back to Operations Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Active Shift Route</h1>
          <p className="text-sm text-gray-500">
             Your location: {haulerLocation?.lat.toFixed(4)}, {haulerLocation?.lon.toFixed(4)}
          </p>
          <p className="text-sm text-green-600 font-medium mt-2">
            ✅ {sortedNodes.length} nodes due for pickup (sorted by proximity)
          </p>
        </div>

        {sortedNodes.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-500 text-lg">🎉 All done! No pending nodes in your zone.</p>
            <Link href="/operations" className="text-blue-600 hover:underline mt-4 inline-block">
              View Full Operations Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNodes.map((node, index) => (
              <div key={node.custom_id} className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">{node.custom_id}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{node.building_type}</p>
                    <p className="text-sm text-gray-500 mb-2">{node.address}</p>
                    {node.num_flats && <p className="text-xs text-gray-400">🏠 {node.num_flats} flats</p>}
                    {node.num_stores && <p className="text-xs text-gray-400">🏪 {node.num_stores} stores</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round(node.distance)}m away
                    </p>
                    <button
                      onClick={() => markAsPickedUp(node.custom_id)}
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded"
                    >
                      ✓ Picked Up
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/operations" className="text-blue-600 hover:underline">
            ← Back to Operations Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}