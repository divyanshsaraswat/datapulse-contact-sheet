import mongoose from 'mongoose';

const ChangelogSchema = new mongoose.Schema(
  {
    endpointId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint', required: true, index: true },
    userId:           { type: String, required: true },
    previousHash:     { type: String },
    newHash:          { type: String },
    previousRowCount: { type: Number },
    newRowCount:      { type: Number },
    addedRows:        { type: Number, default: 0 },
    removedRows:      { type: Number, default: 0 },
    newColumns:       { type: [String], default: [] },
    removedColumns:   { type: [String], default: [] },
    changedColumns:   { type: [String], default: [] },
    summary:          { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Changelog || mongoose.model('Changelog', ChangelogSchema);
