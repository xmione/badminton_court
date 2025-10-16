from django import forms
from .models import Organization


class ComposeEmailForm(forms.Form):
    recipient = forms.EmailField(label='To', widget=forms.EmailInput(attrs={'class': 'form-control'}))
    subject = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'class': 'form-control'}))
    message = forms.CharField(widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 10}))


class OrganizationForm(forms.ModelForm):
    class Meta:
        model = Organization
        fields = ['name', 'email_domain', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'email_domain': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }