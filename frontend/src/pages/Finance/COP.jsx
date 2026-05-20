// This component has been deprecated and replaced by EstateCOP (Monthly) and DailyWeeklyCOP reports.
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function DeprecatedCOP() {
  return <Navigate to="/finance/estate-cop" replace />;
}
