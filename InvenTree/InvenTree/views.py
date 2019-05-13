"""
Various Views which provide extra functionality over base Django Views.

In particular these views provide base functionality for rendering Django forms
as JSON objects and passing them to modal forms (using jQuery / bootstrap).
"""

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.template.loader import render_to_string
from django.http import JsonResponse

from django.views import View
from django.views.generic import UpdateView, CreateView, DeleteView
from django.views.generic.base import TemplateView

from part.models import Part

from rest_framework import views


class TreeSerializer(views.APIView):
    """ JSON View for serializing a Tree object.

    Turns a 'tree' model into a JSON object compatible with bootstrap-treview.

    Ref: https://github.com/jonmiles/bootstrap-treeview
    """

    @property
    def root_url(self):
        """ Return the root URL for the tree. Implementation is class dependent.

        Default implementation returns #
        """

        return '#'

    def itemToJson(self, item):

        data = {
            'pk': item.id,
            'text': item.name,
            'href': item.get_absolute_url(),
            'tags': [item.stock_item_count],
        }

        if item.has_children:
            nodes = []

            for child in item.children.all().order_by('name'):
                nodes.append(self.itemToJson(child))

            data['nodes'] = nodes

        return data

    def get(self, request, *args, **kwargs):

        top_items = self.model.objects.filter(parent=None).order_by('name')

        nodes = []

        top_count = 0

        for item in top_items:
            nodes.append(self.itemToJson(item))
            top_count += item.stock_item_count

        top = {
            'pk': None,
            'text': self.title,
            'href': self.root_url,
            'nodes': nodes,
            'tags': [top_count],
        }

        response = {
            'tree': [top]
        }

        return JsonResponse(response, safe=False)


class AjaxMixin(object):
    """ AjaxMixin provides basic functionality for rendering a Django form to JSON.
    Handles jsonResponse rendering, and adds extra data for the modal forms to process
    on the client side.
    """

    ajax_form_action = ''
    ajax_form_title = ''

    def get_param(self, name, method='GET'):
        """ Get a request query parameter value from URL e.g. ?part=3

        Args:
            name: Variable name e.g. 'part'
            method: Request type ('GET' or 'POST')

        Returns:
            Value of the supplier parameter or None if parameter is not available
        """

        if method == 'POST':
            return self.request.POST.get(name, None)
        else:
            return self.request.GET.get(name, None)

    def get_data(self):
        """ Get extra context data (default implementation is empty dict)

        Returns:
            dict object (empty)
        """
        return {}

    def renderJsonResponse(self, request, form=None, data={}, context={}):
        """ Render a JSON response based on specific class context.

        Args:
            request: HTTP request object (e.g. GET / POST)
            form: Django form object (may be None)
            data: Extra JSON data to pass to client
            context: Extra context data to pass to template rendering

        Returns:
            JSON response object
        """

        if form:
            context['form'] = form

        data['title'] = self.ajax_form_title

        data['html_form'] = render_to_string(
            self.ajax_template_name,
            context,
            request=request
        )

        # Custom feedback`data
        fb = self.get_data()

        for key in fb.keys():
            data[key] = fb[key]

        return JsonResponse(data, safe=False)


class AjaxView(AjaxMixin, View):
    """ An 'AJAXified' View for displaying an object
    """

    # By default, point to the modal_form template
    # (this can be overridden by a child class)
    ajax_template_name = 'modal_form.html'

    def post(self, request, *args, **kwargs):
        return JsonResponse('', safe=False)

    def get(self, request, *args, **kwargs):

        return self.renderJsonResponse(request)


class QRCodeView(AjaxView):
    """ An 'AJAXified' view for displaying a QR code.

    Subclasses should implement the get_qr_data(self) function.
    """

    ajax_template_name = "qr_code.html"
    
    def get(self, request, *args, **kwargs):
        self.request = request
        self.pk = self.kwargs['pk']
        return self.renderJsonResponse(request, None, context=self.get_context_data())

    def get_qr_data(self):
        """ Returns the text object to render to a QR code.
        The actual rendering will be handled by the template """
        
        return None

    def get_context_data(self):
        """ Get context data for passing to the rendering template.

        Explicity passes the parameter 'qr_data'
        """
        
        context = {}

        qr = self.get_qr_data()

        if qr:
            context['qr_data'] = qr
        else:
            context['error_msg'] = 'Error generating QR code'
        
        return context


class AjaxCreateView(AjaxMixin, CreateView):

    """ An 'AJAXified' CreateView for creating a new object in the db
    - Returns a form in JSON format (for delivery to a modal window)
    - Handles form validation via AJAX POST requests
    """

    def get(self, request, *args, **kwargs):
        """ Creates form with initial data, and renders JSON response """

        super(CreateView, self).get(request, *args, **kwargs)

        form = self.get_form()
        return self.renderJsonResponse(request, form)

    def post(self, request, *args, **kwargs):
        """ Responds to form POST. Validates POST data and returns status info.

        - Validate POST form data
        - If valid, save form
        - Return status info (success / failure)
        """
        form = self.get_form()

        # Extra JSON data sent alongside form
        data = {
            'form_valid': form.is_valid(),
        }

        if form.is_valid():
            obj = form.save()

            # Return the PK of the newly-created object
            data['pk'] = obj.pk

            try:
                data['url'] = obj.get_absolute_url()
            except AttributeError:
                pass

        return self.renderJsonResponse(request, form, data)


class AjaxUpdateView(AjaxMixin, UpdateView):
    """ An 'AJAXified' UpdateView for updating an object in the db
    - Returns form in JSON format (for delivery to a modal window)
    - Handles repeated form validation (via AJAX) until the form is valid
    """

    def get(self, request, *args, **kwargs):
        """ Respond to GET request.

        - Populates form with object data
        - Renders form to JSON and returns to client
        """

        super(UpdateView, self).get(request, *args, **kwargs)
        
        return self.renderJsonResponse(request, self.get_form(), context=self.get_context_data())

    def post(self, request, *args, **kwargs):
        """ Respond to POST request.

        - Updates model with POST field data
        - Performs form and object validation
        - If errors exist, re-render the form
        - Otherwise, return sucess status
        """

        # Make sure we have an object to point to
        self.object = self.get_object()

        form = self.get_form()

        data = {
            'form_valid': form.is_valid()
        }

        if form.is_valid():
            obj = form.save()

            # Include context data about the updated object
            data['pk'] = obj.id

            try:
                data['url'] = obj.get_absolute_url()
            except AttributeError:
                pass

        return self.renderJsonResponse(request, form, data)


class AjaxDeleteView(AjaxMixin, DeleteView):

    """ An 'AJAXified DeleteView for removing an object from the DB
    - Returns a HTML object (not a form!) in JSON format (for delivery to a modal window)
    - Handles deletion
    """

    def get(self, request, *args, **kwargs):
        """ Respond to GET request

        - Render a DELETE confirmation form to JSON
        - Return rendered form to client
        """

        super(DeleteView, self).get(request, *args, **kwargs)

        data = {
            'id': self.get_object().id,
            'delete': False,
            'title': self.ajax_form_title,
            'html_data': render_to_string(
                self.ajax_template_name,
                self.get_context_data(),
                request=request)
        }

        return JsonResponse(data)

    def post(self, request, *args, **kwargs):
        """ Respond to POST request

        - DELETE the object
        - Render success message to JSON and return to client
        """

        obj = self.get_object()
        pk = obj.id
        obj.delete()

        data = {
            'id': pk,
            'delete': True
        }

        return self.renderJsonResponse(request, data=data)


class IndexView(TemplateView):
    """ View for InvenTree index page """

    template_name = 'InvenTree/index.html'

    def get_context_data(self, **kwargs):

        context = super(TemplateView, self).get_context_data(**kwargs)

        context['starred'] = [star.part for star in self.request.user.starred_parts.all()]

        # Generate a list of orderable parts which have stock below their minimum values
        # TODO - Is there a less expensive way to get these from the database
        context['to_order'] = [part for part in Part.objects.filter(purchaseable=True) if part.need_to_restock()]
    
        # Generate a list of buildable parts which have stock below their minimum values
        # TODO - Is there a less expensive way to get these from the database
        context['to_build'] = [part for part in Part.objects.filter(buildable=True) if part.need_to_restock()]

        return context


class SearchView(TemplateView):
    """ View for InvenTree search page.

    Displays results of search query
    """

    template_name = 'InvenTree/search.html'

    def post(self, request, *args, **kwargs):
        """ Handle POST request (which contains search query).

        Pass the search query to the page template
        """

        context = self.get_context_data()

        query = request.POST.get('search', '')

        context['query'] = query

        return super(TemplateView, self).render_to_response(context)
