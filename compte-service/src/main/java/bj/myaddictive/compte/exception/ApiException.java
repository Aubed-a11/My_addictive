package bj.myaddictive.compte.exception;

import org.springframework.http.HttpStatus;

/** Exception metier renvoyee telle quelle au client sous forme de message clair (en francais). */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
