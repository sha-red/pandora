import os

from celery import Celery

root_dir = os.path.normpath(os.path.abspath(os.path.dirname(__file__)))
root_dir = os.path.dirname(root_dir)
os.chdir(root_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

app = Celery('pandora', broker_connection_retry_on_startup=True)
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
