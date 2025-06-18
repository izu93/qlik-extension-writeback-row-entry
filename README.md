# Smart Writeback Extension

**Intelligent Qlik Sense Extension with Auto-Column Mapping**

Upload Excel/CSV files and automatically map columns to your Qlik data model for seamless writeback functionality.

## Features

- **Smart Column Mapping**: Automatically suggests the best Qlik field matches for uploaded columns
- **Multi-Format Support**: Excel (.xlsx, .xls) and CSV files
- **Real-time Editing**: Row-level data entry with rich input controls
- **Auto-Save**: Seamless integration with Qlik Automations for data persistence
- **Optimized for Sports Data**: Perfect for swimming competitions, training logs, and performance tracking

## Architecture

### Phase 1: Foundation & File Upload

- [x] File upload with drag-and-drop
- [x] Excel/CSV parsing
- [x] Qlik data model analysis
- [ ] Core services setup

### Phase 2: Smart Mapping (In Progress)

- [ ] Intelligent column matching algorithm
- [ ] Fuzzy string matching
- [ ] Data type inference
- [ ] Mapping confirmation UI

### Phase 3: Dynamic Table Generation

- [ ] Property panel generation
- [ ] Hypercube builder
- [ ] Editable table rendering

### Phase 4: Enhanced Editing

- [ ] Rich input controls (dropdowns, date pickers)
- [ ] Data validation
- [ ] Auto-complete functionality

### Phase 5: Save/Load Integration

- [ ] Qlik Automation integration
- [ ] Audit trail and versioning
- [ ] Conflict resolution

## Quick Start

### Prerequisites

- Node.js 18+
- Qlik Sense environment
- Nebula.js CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/izu93/qlik-extension-writeback-row-entry.git
cd qlik-extension-writeback-row-entry

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Development

```bash
# Serve extension locally
npm start

# Connect to Qlik Sense
npm run sense

# Run linting
npm run lint
```

## Example Data Format

Perfect for swimming competition data:

| place | heat   | lane | name             | team | reaction_time | time  | event               | competition           | distance |
| ----- | ------ | ---- | ---------------- | ---- | ------------- | ----- | ------------------- | --------------------- | -------- |
| 3     | final  | 4    | MURPHY Ryan      | USA  | 0.52          | 52.19 | men 100m backstroke | Olympics 2020 - Tokyo | 50       |
| 5     | heat_4 | 5    | ARMSTRONG Joseph | USA  | 0.72          | 53.77 | men 100m backstroke | Olympics 2020 - Tokyo | 50       |

## Configuration

### Supported Field Types

- **Dimensions**: place, heat, lane, name, team, event, competition
- **Measures**: reaction_time, time, distance, lap_time
- **Custom Fields**: Auto-detected from your Qlik data model

### Smart Mapping Examples

- `name` → `Athlete Name` (dimension)
- `time` → `Race Time` (measure)
- `event` → `Event Type` (dimension)
- `reaction_time` → `Reaction Time` (measure)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Status

**Current Phase**: Phase 1 - Foundation & File Upload

- Project structure
- File upload component
- Basic UI framework
- Core services implementation
- Next: Column mapping engine

## License

MIT License - see [LICENSE](LICENSE) file for details.

## For Swimming Data

This extension was designed with swimming competition data in mind, making it ideal for:

- Competition results tracking
- Training session logs
- Performance analysis
- Team management
- Meet organization

---

**Built using Nebula.js and React**
