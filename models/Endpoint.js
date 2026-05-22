import mongoose from 'mongoose';

const HeaderSchema = new mongoose.Schema(
  { key: String, value: String },
  { _id: false }
);

const EndpointSchema = new mongoose.Schema(
  {
    userId:          { type: String, required: true, index: true },
    name:            { type: String, required: true, trim: true },
    url:             { type: String, required: true, trim: true },
    description:     { type: String, default: '' },
    tags:            { type: [String], default: [] },
    headers:         { type: [HeaderSchema], default: [] },

    // Snapshot state
    lastFetchedAt:   { type: Date, default: null },
    lastHash:        { type: String, default: null },
    lastRowCount:    { type: Number, default: null },
    lastColumns:     { type: [String], default: [] },

    // Status
    hasUpdate:       { type: Boolean, default: false },
    status:          { type: String, enum: ['idle', 'ok', 'error', 'fetching'], default: 'idle' },
    errorMessage:    { type: String, default: null },

    // Options
    isPinned:        { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
    pollingInterval: { type: Number, default: 0 }, // minutes, 0 = off
  },
  { timestamps: true }
);

export default mongoose.models.Endpoint || mongoose.model('Endpoint', EndpointSchema);
