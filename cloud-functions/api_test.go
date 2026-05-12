package main

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBcrypt(t *testing.T) {
	require := require.New(t)

	t.Run("hash and verify", func(t *testing.T) {
		hashed, err := Hash("bcrypt", "123")
		require.Nil(err)
		require.True(strings.HasPrefix(hashed, "$2a$"))

		{
			valid, err := Verify(hashed, "123")
			require.Nil(err)
			require.True(valid)
		}

		{
			valid, err := Verify(hashed, "1234")
			require.Nil(err)
			require.False(valid)
		}
	})

	t.Run("good case", func(t *testing.T) {
		validHashedList := []string{
			"$2a$10$M7UO8LraA0gPTmndlhy1buZ7DtyM9fZC4e1jPlC1GiqhJgLjUNbj2",
			"$2a$12$7lIvHiGwTSzbCXUeJAJFvuD5Yq9lr4JmlJGUZff0fXMtPbyyfucKC",
		}

		for _, hashed := range validHashedList {
			valid, err := Verify(hashed, "123")
			require.Nil(err)
			require.True(valid)
		}
	})

	t.Run("bad case", func(t *testing.T) {
		hashed, err := Hash("bcrypt", "123")
		require.Nil(err)
		require.True(strings.HasPrefix(hashed, "$2a$"))

		// bcrypt will ignore extra suffix
		valid, err := Verify(hashed+"123", "123")
		require.Nil(err)
		require.True(valid)
	})
}

func TestArgon2id(t *testing.T) {
	require := require.New(t)

	t.Run("hash and verify", func(t *testing.T) {
		hashed, err := Hash("argon2id", "123")
		require.Nil(err)
		require.True(strings.HasPrefix(hashed, "$argon2id$"))

		{
			valid, err := Verify(hashed, "123")
			require.Nil(err)
			require.True(valid)
		}

		{
			valid, err := Verify(hashed, "1234")
			require.Nil(err)
			require.False(valid)
		}
	})

	t.Run("good case", func(t *testing.T) {
		validHashedList := []string{
			"$argon2id$v=19$m=65536,t=1,p=10$OgcDgDyBmacsp0CvCA3rCQ$BVLXuosKaPax8GJKSa+xT3HnJkGOMLgLCuL85a962Uk",
			"$argon2id$v=19$m=16,t=2,p=1$MTIzNDU2Nzg$gGqaw58PB+xUhET0UEgP9A",
		}

		for _, hashed := range validHashedList {
			valid, err := Verify(hashed, "123")
			require.Nil(err)
			require.True(valid)
		}
	})

	t.Run("bad case", func(t *testing.T) {
		hashed, err := Hash("argon2id", "123")
		require.Nil(err)
		require.True(strings.HasPrefix(hashed, "$argon2id$"))

		// bcrypt will ignore extra suffix
		valid, err := Verify(hashed+"123", "123")
		require.NotNil(err)
		require.False(valid)
	})
}
