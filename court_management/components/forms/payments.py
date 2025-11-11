# court_management/components/forms/payments.py

from django import forms
from ..models import ( Payment )

class PaymentForm(forms.ModelForm):
    payment_method = forms.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)
    
    class Meta:
        model = Payment
        fields = ['amount', 'payment_method', 'transaction_id', 'notes']
        widgets = {
            'amount': forms.NumberInput(attrs={'step': '0.01'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }
 