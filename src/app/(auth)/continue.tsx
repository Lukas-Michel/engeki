import { useSignIn, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthInput, AuthShell } from '@/components/auth/auth-shell';
import { ThemedText } from '@/components/themed-text';
import { GradientButton, Icon } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HANDLED_FIELDS = ['first_name', 'last_name', 'legal_accepted'];

export default function ContinueScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { signIn } = useSignIn();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const missingFields = signUp.missingFields ?? [];
  const needsFirstName = missingFields.includes('first_name');
  const needsLastName = missingFields.includes('last_name');
  const needsLegalAccepted = missingFields.includes('legal_accepted');
  const unsupportedFields = missingFields.filter((field) => !HANDLED_FIELDS.includes(field));
  const unsupportedMessage =
    signUp.status === 'missing_requirements' && unsupportedFields.length > 0
      ? `Clerk still requires: ${formatFields(unsupportedFields)}.`
      : '';
  const busy = fetchStatus === 'fetching';
  const disabled =
    busy ||
    unsupportedFields.length > 0 ||
    (needsFirstName && !firstName.trim()) ||
    (needsLastName && !lastName.trim()) ||
    (needsLegalAccepted && !legalAccepted);

  useEffect(() => {
    let cancelled = false;

    const finalizeCompleteAuth = async () => {
      if (signIn.status === 'complete') {
        const finalized = await signIn.finalize();
        if (cancelled) {
          return;
        }
        if (finalized.error) {
          setMessage(finalized.error.message);
          return;
        }
        router.replace('/');
        return;
      }

      if (signUp.status === 'complete') {
        const finalized = await signUp.finalize();
        if (cancelled) {
          return;
        }
        if (finalized.error) {
          setMessage(finalized.error.message);
          return;
        }
        router.replace('/');
      }
    };

    void finalizeCompleteAuth();

    return () => {
      cancelled = true;
    };
  }, [router, signIn, signIn.status, signUp, signUp.status]);

  const complete = async () => {
    setMessage('');

    if (signIn.status === 'complete') {
      await signIn.finalize();
      router.replace('/');
      return;
    }

    const signUpStatus = signUp.status;

    if (signUpStatus !== 'missing_requirements') {
      setMessage('Restart Google sign-in to finish this account.');
      return;
    }

    const update = await signUp.update({
      ...(needsFirstName ? { firstName: firstName.trim() } : {}),
      ...(needsLastName ? { lastName: lastName.trim() } : {}),
      ...(needsLegalAccepted ? { legalAccepted } : {}),
    });

    if (update.error) {
      setMessage(update.error.message);
      return;
    }

    if (signUp.status === 'complete') {
      const finalized = await signUp.finalize();
      if (finalized.error) {
        setMessage(finalized.error.message);
        return;
      }
      router.replace('/');
      return;
    }

    setMessage(`Clerk still requires: ${formatFields(signUp.missingFields ?? [])}.`);
  };

  return (
    <AuthShell title="Finish setup" subtitle="Google sign-in needs a little more account information.">
      {needsFirstName ? (
        <>
          <AuthInput
            icon="user"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="First name"
          />
          {errors.fields.firstName ? (
            <ThemedText type="small" themeColor="danger">
              {errors.fields.firstName.message}
            </ThemedText>
          ) : null}
        </>
      ) : null}

      {needsLastName ? (
        <>
          <AuthInput
            icon="user"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Last name"
          />
          {errors.fields.lastName ? (
            <ThemedText type="small" themeColor="danger">
              {errors.fields.lastName.message}
            </ThemedText>
          ) : null}
        </>
      ) : null}

      {needsLegalAccepted ? (
        <Pressable
          onPress={() => setLegalAccepted((current) => !current)}
          style={[styles.checkRow, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.checkBox, { borderColor: legalAccepted ? theme.accent : theme.textTertiary }]}>
            {legalAccepted ? <Icon name="check" size={14} themeColor="accent" /> : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            I accept the required legal terms.
          </ThemedText>
        </Pressable>
      ) : null}

      {message || unsupportedMessage ? (
        <ThemedText type="small" themeColor="danger">
          {message || unsupportedMessage}
        </ThemedText>
      ) : null}

      <GradientButton label="Continue" icon="arrow-right" onPress={complete} loading={busy} disabled={disabled} />
    </AuthShell>
  );
}

function formatFields(fields: string[]) {
  if (fields.length === 0) {
    return 'more account information';
  }

  return fields.map((field) => field.replaceAll('_', ' ')).join(', ');
}

const styles = StyleSheet.create({
  checkRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
