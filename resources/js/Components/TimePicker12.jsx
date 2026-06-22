import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Create a custom dark theme to match the application's aesthetic
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4F46E5', // Indigo-600
    },
    background: {
      paper: '#1E1E1E',
      default: '#121212',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            color: '#ffffff',
            height: '42px',
            fontSize: '12px',
            '& fieldset': {
              borderColor: '#2C2C2C',
            },
            '&:hover fieldset': {
              borderColor: '#4F46E5',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4F46E5',
            },
          },
          '& .MuiInputBase-input': {
            padding: '10px 14px',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#A0A0A0',
        },
      },
    },
    MuiPickersToolbarText: {
      styleOverrides: {
        root: {
          color: '#6B7280', // Dimmer unselected color
          '&.Mui-selected': {
            color: '#FFFFFF', // Bright white
            fontWeight: '900', // Extra bold
            backgroundColor: '#4F46E5', // Indigo background to clearly show selection
            padding: '4px 8px',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiClockNumber: {
      styleOverrides: {
        root: {
          color: '#A0A0A0',
          '&.Mui-selected': {
            color: '#FFFFFF',
            fontWeight: '900',
          },
        },
      },
    },
  },
});

export default function TimePicker12({ value, onChange, className = '' }) {
    // Parse the "09:15 AM" string back into a DayJS object
    const timeObj = value ? dayjs(`1970-01-01 ${value}`, 'YYYY-MM-DD hh:mm A') : null;

    const handleChange = (newValue) => {
        if (newValue && newValue.isValid()) {
            onChange(newValue.format('hh:mm A'));
        }
    };

    return (
        <div className={`w-full ${className}`}>
            <ThemeProvider theme={darkTheme}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                        value={timeObj}
                        onChange={handleChange}
                        views={['hours', 'minutes']}
                        format="hh:mm A"
                        slotProps={{
                            textField: { 
                                fullWidth: true,
                                variant: 'outlined',
                            }
                        }}
                    />
                </LocalizationProvider>
            </ThemeProvider>
        </div>
    );
}
