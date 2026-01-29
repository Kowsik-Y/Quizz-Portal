-- Migration: Add certificates table for automated credential generation and verification
-- Date: 2026-01-29

-- Create Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  certificate_code VARCHAR(255) UNIQUE NOT NULL,
  certificate_type VARCHAR(20) DEFAULT 'both' CHECK (certificate_type IN ('pdf', 'badge', 'both')),
  pdf_url VARCHAR(500),
  badge_url VARCHAR(500),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_test ON certificates(test_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_attempt ON certificates(attempt_id);

-- Add comment for documentation
COMMENT ON TABLE certificates IS 'Stores certificates issued to students for passing tests';
COMMENT ON COLUMN certificates.certificate_code IS 'Unique verification code for certificate (format: CERT-{testId}-{studentId}-{timestamp}-{random})';
COMMENT ON COLUMN certificates.certificate_type IS 'Type of certificate: pdf, badge, or both';
COMMENT ON COLUMN certificates.pdf_url IS 'URL to generated PDF certificate file';
COMMENT ON COLUMN certificates.badge_url IS 'URL to generated digital badge image';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: certificates table added successfully';
END $$;
