# MAFDC - Dental Clinic Management System

A comprehensive dental clinic management system built with Next.js, featuring patient management, appointment booking, and administrative tools.

## Features

- **Patient Management**: Complete CRUD operations for patient records
- **Appointment Booking**: Online appointment scheduling system with real-time availability
- **Advanced Patient Search**: Powerful search functionality using POST requests with filters
- **Authentication**: Secure login system with JWT tokens
- **Responsive Design**: Modern UI built with Shadcn UI components
- **Real-time Updates**: Live data synchronization with backend APIs

## API Integration

### Patient Search API

The application now uses a more secure and flexible POST-based search endpoint instead of query parameters:

**Endpoint**: `POST /api/v1/patients/search`

**Request Body**:
```json
{
  "search": "john@email.com",
  "page": 1,
  "limit": 10,
  "filters": {
    "gender": "Male",
    "ageRange": { "min": 18, "max": 65 },
    "isActive": true,
    "lastVisit": { "from": "2024-01-01", "to": "2024-12-31" }
  }
}
```

**Benefits of POST over GET for search**:
- 🔒 **Security**: Search parameters not exposed in URLs/logs
- 📊 **Complex Queries**: Easier to send complex filter objects
- 📏 **No URL Limits**: No restrictions on data size
- 🎯 **Better Performance**: More efficient for complex searches

**Available Filters**:
- `search`: Text search across firstName, lastName, contactNumber, email
- `gender`: Filter by patient gender
- `ageRange`: Filter by age range (min/max)
- `isActive`: Filter by patient status
- `lastVisit`: Filter by last visit date range

## Appointment Booking Flow

1. **Patient Search**: Patients enter their email address to find their record
2. **Verification**: Simple 6-digit code verification (can be enhanced with email/SMS)
3. **Service Selection**: Choose from available dental services
4. **Date & Time**: Select preferred appointment date and time slot
5. **Confirmation**: Review details and confirm booking
6. **Success**: Appointment is created and confirmation is shown

## Project Structure

```
mafdc/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── onlineappointment/ # Online appointment booking
│   │   ├── patients/          # Patient management
│   │   └── dashboard/         # Admin dashboard
│   ├── components/            # Reusable UI components
│   │   ├── search-your-record.tsx    # Patient search component
│   │   └── ui/               # Base UI components
│   ├── hooks/                # Custom React hooks
│   │   ├── patients/         # Patient-related hooks
│   │   └── appointments/     # Appointment-related hooks
│   └── lib/                  # Utility functions
└── public/                   # Static assets
```

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React icons
- **State Management**: React hooks
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Notifications**: Sonner toast

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
