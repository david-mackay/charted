# THIS FILE IS NOT BEING USED. THIS FILE IS TO LOAD THE API-KEY INTO THE HTML TEMPLATE
import environ

env = environ.Env()
environ.Env.read_env()

API_KEY = env('API_KEY')
