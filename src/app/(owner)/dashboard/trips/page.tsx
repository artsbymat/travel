"use client";

import dynamic from "next/dynamic";

const TripCalendar = dynamic(() => import("@/components/vendor/trip-calendar"), { ssr: false });
const CreateTripDialog = dynamic(() => import("@/components/vendor/create-trip-dialog"), { ssr: false });
const TripDetailDrawer = dynamic(() => import("@/components/vendor/trip-detail-drawer"), { ssr: false });
const EditTripDialog = dynamic(() => import("@/components/vendor/edit-trip-dialog"), { ssr: false });
const RescheduleDialog = dynamic(() => import("@/components/vendor/reschedule-dialog"), { ssr: false });
const TripTemplateDrawer = dynamic(() => import("@/components/vendor/trip-template-drawer"), { ssr: false });

export default function OwnerTripsPage() {
  return (
    <>
      <TripCalendar />
      <CreateTripDialog />
      <TripDetailDrawer />
      <EditTripDialog />
      <RescheduleDialog />
      <TripTemplateDrawer />
    </>
  );
}
