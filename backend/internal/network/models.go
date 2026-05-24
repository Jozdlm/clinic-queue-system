package network

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type Response struct {
	Success bool         `json:"success"`
	Code    int          `json:"code"`
	Message string       `json:"message,omitempty"`
	Errors  []FieldError `json:"errors,omitempty"`
	Data    any          `json:"data,omitempty"`
}
