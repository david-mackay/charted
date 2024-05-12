# THIS FILE IS NOT BEING USED. THIS FILE IS TO LOAD THE API-KEY INTO THE HTML TEMPLATE
from django.shortcuts import render
from django.conf import settings

def my_view(request):
    return render(request, 'frontend/upload_images.html', {'api_key': settings.API_KEY})
