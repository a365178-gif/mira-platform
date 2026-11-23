-- Explicitly labeled, development-only self-attestation. Never use as a
-- production verification method.
alter type public.age_verification_method add value if not exists 'self_attested_test';
