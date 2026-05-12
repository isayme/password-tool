package main

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/isayme/go-scrypt"
	"golang.org/x/crypto/bcrypt"
)

var Name = "password-tool"
var Version = "0.0.0"

const (
	algorithmBcrypt = "bcrypt"
	algorithmArgon2 = "argon2"
	algorithmScrypt = "scrypt"
	algorithmPbkdf2 = "pbkdf2"
)

func randSalt(len int) (string, error) {
	salt := make([]byte, len)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	return hex.EncodeToString(salt), nil
}

type passwordHasher interface {
	Hash(password string) (string, error)
	Verify(hashed, password string) (bool, error)

	// 是否支持此算法
	Supported(algorithm string) bool

	// 是否可以验证此hash结果
	Match(hashed string) bool
}

var passwordHasherList = []passwordHasher{}

type bcryptPasswordHasher struct {
}

func (h bcryptPasswordHasher) Hash(password string) (string, error) {
	buf, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
func (h bcryptPasswordHasher) Verify(hashed, password string) (bool, error) {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password)) == nil, nil
}

func (h bcryptPasswordHasher) Supported(algorithm string) bool {
	return algorithm == "bcrypt"
}

func (h bcryptPasswordHasher) Match(hashed string) bool {
	return strings.HasPrefix(hashed, "$2a$")
}

type argon2idPasswordHasher struct {
}

func (h argon2idPasswordHasher) Hash(password string) (string, error) {
	return argon2id.CreateHash(password, argon2id.DefaultParams)
}

func (h argon2idPasswordHasher) Verify(hashed, password string) (bool, error) {
	match, _, err := argon2id.CheckHash(password, hashed)
	return match, err
}

func (h argon2idPasswordHasher) Supported(algorithm string) bool {
	return algorithm == "argon2" || algorithm == "argon2id"
}

func (h argon2idPasswordHasher) Match(hashed string) bool {
	return strings.HasPrefix(hashed, "$argon2id$")
}

type scryptPasswordHasher struct {
}

func (h scryptPasswordHasher) Hash(password string) (string, error) {
	return scrypt.Hash(password, scrypt.DefaultParams)
}

func (h scryptPasswordHasher) Verify(hashed, password string) (bool, error) {
	match, err := scrypt.Verify(password, hashed)
	return match, err
}

func (h scryptPasswordHasher) Supported(algorithm string) bool {
	return algorithm == "scrypt"
}

func (h scryptPasswordHasher) Match(hashed string) bool {
	return strings.HasPrefix(hashed, "$scrypt$")
}

func init() {
	passwordHasherList = append(passwordHasherList, bcryptPasswordHasher{})
	passwordHasherList = append(passwordHasherList, argon2idPasswordHasher{})
	passwordHasherList = append(passwordHasherList, scryptPasswordHasher{})
}

func Hash(algorithm, password string) (string, error) {
	for _, hasher := range passwordHasherList {
		if hasher.Supported(algorithm) {
			return hasher.Hash(password)
		}
	}

	return "", errors.New("not supported algorithm")
}

func Verify(hashed, password string) (bool, error) {
	for _, hasher := range passwordHasherList {
		if hasher.Match(hashed) {
			return hasher.Verify(hashed, password)
		}
	}

	return false, errors.New("not supported hashed")
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // Process the request first

		// Check if any errors were added to the context
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
		}
	}
}

type hashRequest struct {
	Algorithm string `json:"algorithm" binding:"required"`
	Password  string `json:"password" binding:"required"`
}

type hashResponse struct {
	Hashed string `json:"hashed"`
}

type verifyRequest struct {
	Password string `json:"password" binding:"required"`
	Hashed   string `json:"hashed" binding:"required"`
}

type verifyResponse struct {
	Valid bool `json:"valid"`
}

func main() {
	r := gin.Default()

	r.Use(ErrorHandler())

	r.GET("/version", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"name":    Name,
			"version": Version,
		})
	})

	g := r.Group("/v1")

	g.POST("/hash", func(c *gin.Context) {
		req := hashRequest{}
		if err := c.BindJSON(&req); err != nil {
			c.Error(err)
			return
		}

		hashed, err := Hash(req.Algorithm, req.Password)
		if err != nil {
			c.Error(err)
			return
		}

		c.JSON(200, hashResponse{
			Hashed: hashed,
		})
	})

	g.POST("/verify", func(c *gin.Context) {
		req := verifyRequest{}
		if err := c.BindJSON(&req); err != nil {
			c.Error(err)
			return
		}

		valid, err := Verify(req.Hashed, req.Password)
		if err != nil {
			c.Error(err)
			return
		}

		c.JSON(200, verifyResponse{
			Valid: valid,
		})
	})

	// r.Static("/", "./dist")

	r.Run(":9000")
}
