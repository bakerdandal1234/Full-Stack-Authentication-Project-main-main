import React from 'react';
import { Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * مكون تنبيه قابل للإغلاق مع حركات انتقالية
 * @param {Object} props - خصائص المكون
 * @param {string} props.error - نص رسالة التنبيه
 * @param {Function} props.onClose - دالة تُستدعى عند النقر على زر الإغلاق
 * @param {string} [props.severity='error'] - نوع التنبيه: 'error' | 'warning' | 'info' | 'success'
 */
const ErrorAlert = ({ error, onClose, severity = 'error' }) => {
  if (!error) return null;

  return (
    <Collapse in={!!error}>
      <Alert 
        severity={severity}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ 
          mb: 2,
          width: '100%',
          '& .MuiAlert-message': {
            width: '100%'
          },
          animation: 'slideIn 0.3s ease-out',
          '@keyframes slideIn': {
            '0%': {
              transform: 'translateY(-20px)',
              opacity: 0
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1
            }
          }
        }}
      >
        <AlertTitle>
          {severity === 'error' ? 'خطأ' : 
           severity === 'success' ? 'تم بنجاح' :
           severity === 'warning' ? 'تحذير' : 'معلومات'}
        </AlertTitle>
        {error}
      </Alert>
    </Collapse>
  );
};

export default ErrorAlert;
