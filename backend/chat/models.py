from django.db import models
from django.conf import settings


class ChatSession(models.Model):
    """A chat session between users."""
    session_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Chat Session {self.session_id}"


class ChatParticipant(models.Model):
    """A participant in a chat session."""
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('chat_session', 'user')
    
    def __str__(self):
        return f"{self.user.username} in {self.chat_session}"


class Message(models.Model):
    """A message in a chat session."""
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()  # Message content
    is_encrypted = models.BooleanField(default=False)  # Whether the content is encrypted
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}" 